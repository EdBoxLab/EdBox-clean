import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from '@/app/pulse/services/genie-tooling';
import { getNextGroqKey, getGroqKeys } from '@/lib/ai-providers';
import { getStudentModelService } from '@/lib/services/student-model';
import { buildAdaptiveContext } from '@/lib/services/adaptive-context-builder';
import { getSpacedRepetitionService } from '@/lib/services/spaced-repetition';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

interface GroqToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

function convertToGroqTools(geminiTools: any[]): any[] {
  const tools: any[] = [];
  for (const tool of geminiTools) {
    if (tool.functionDeclarations) {
      for (const decl of tool.functionDeclarations) {
        tools.push({
          type: 'function',
          function: {
            name: decl.name,
            description: decl.description,
            parameters: {
              type: 'object',
              properties: decl.parameters?.properties || {},
              required: decl.parameters?.required || [],
            },
          },
        });
      }
    }
  }
  return tools;
}

const GROQ_TOOLS = convertToGroqTools(GENIE_TOOLS);

// Session memory lives per Node.js instance (server-side hot path)
const sessionMessages = new Map<string, ChatMessage[]>();

function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${prefix}] ${timestamp} - ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${prefix}] ${timestamp} - ${message}`);
  }
}

/** Provides a meaningful tool result description for Genie's next reasoning step */
function getToolResult(toolName: string, args: any): string {
  switch (toolName) {
    case 'update_skill_progress':
      return `Skill progress updated — action: "${args.action}"${args.topic ? `, topic: "${args.topic}"` : ''}${args.next_stage ? `, next_stage: "${args.next_stage}"` : ''}. The widget sidebar has been updated.`;
    case 'record_learning_signal':
      return `Learning signal recorded — type: "${args.signal_type}", confidence: ${args.confidence}, depth: ${args.depth ?? 'not specified'}, topic: "${args.topic}". Signal added to the learner's Skill Graph CV.`;
    case 'deploy_widget':
      return `Widget "${args.widget_type}" deployed to the workspace canvas.`;
    case 'create_custom_widget':
      return `Custom widget "${args.title}" rendered in the workspace.`;
    case 'update_widget':
      return 'Widget content updated. The learner can see the new content.';
    case 'update_code':
    case 'write_code':
      return 'Code written to the editor.';
    case 'run_code':
      return 'Code execution triggered. Logs will appear in the editor.';
    case 'close_widget':
      return `Widget closed.`;
    default:
      return 'Action completed successfully.';
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { message, sessionId, currentWindows, demoMode } = body;

    log('PULSE-GENIE', 'Request received', {
      messageLength: message?.length,
      sessionId,
      windowsCount: currentWindows?.length || 0,
      demoMode,
    });

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const groqKeys = getGroqKeys();
    const hasGroqKey = groqKeys.length > 0;

    // --- Demo / no-key fallback ---
    if (!hasGroqKey || demoMode) {
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        return NextResponse.json({
          response: "I've deployed an interactive Neuron Visualizer. Try adjusting the bias!",
          toolCalls: [{ name: 'deploy_widget', args: { widget_type: 'NEURON_VISUALIZER' } }],
        });
      }
      return NextResponse.json({
        response: "I'm The Genie. What are we exploring today?",
        toolCalls: [],
      });
    }

    // --- Session memory ---
    let messages = sessionMessages.get(sessionId);
    if (!messages) {
      messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
      sessionMessages.set(sessionId, messages);
      log('PULSE-GENIE', 'New session initialized', { sessionId });
    }

    // --- Context assembly ---
    let contextString = '';

    // BUG FIX: Auto-inject [SKILL_SESSION_ACTIVE] whenever a SKILL_SESSION widget is open.
    // This keeps Genie's RULE 6 (Tutor Mode) alive across ALL turns, not just the first.
    const skillWindow = currentWindows?.find((w: any) => w.type === 'SKILL_SESSION');
    if (skillWindow && !message.includes('[SKILL_SESSION_ACTIVE]')) {
      contextString += [
        '',
        '[SKILL_SESSION_ACTIVE]',
        `skillId: ${skillWindow.data?.skillId || 'unknown'}`,
        `graphId: ${skillWindow.data?.graphId || 'unknown'}`,
        '',
      ].join('\n');
      // Inject full adaptive context: student model + spaced repetition + session state
      try {
        const adaptiveCtx = await buildAdaptiveContext({
          userId: sessionId,
          skillId: skillWindow.data?.skillId || 'unknown',
          graphId: skillWindow.data?.graphId || 'unknown',
        });
        contextString += '\n' + adaptiveCtx + '\n';
      } catch (e) {
        log('PULSE-GENIE', 'Adaptive context build failed (non-fatal)', { error: String(e) });
      }
      log('PULSE-GENIE', 'Auto-injected SKILL_SESSION_ACTIVE + adaptive context');
    }

    // Workspace widget state
    if (currentWindows && currentWindows.length > 0) {
      contextString += '\n\n[CURRENT WORKSPACE STATE]:\n';
      currentWindows.forEach((w: any) => {
        contextString += `Widget: ${w.type} | Title: "${w.title}" | ID: ${w.id}\n`;
        if (w.data?.code) contextString += `Code snippet: ${w.data.code.substring(0, 300)}...\n`;
        if (w.data?.text) contextString += `Text: ${w.data.text.substring(0, 200)}\n`;
        contextString += '---\n';
      });
    }

    const fullMessage = message + contextString;
    messages.push({ role: 'user', content: fullMessage });

    log('PULSE-GENIE', 'Context built', {
      hasSkillSession: !!skillWindow,
      contextLen: contextString.length,
      totalMessages: messages.length,
    });

    const apiKey = getNextGroqKey();
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    // ─────────────────────────────────────────────────────────────────────────
    // MULTI-ROUND TOOL LOOP
    // Allows Genie to chain tool calls in sequence within a single user turn:
    //   Round 1: deploy_widget(BLACKBOARD) + write content
    //   Round 2: deploy_widget(CODE_EDITOR) or create_custom_widget
    //   Round 3: record_learning_signal
    //   Round 4: update_skill_progress
    //   Round 5: final text response to the chat
    //
    // BUG FIX: tools: GROQ_TOOLS is now passed on EVERY call, not just the first.
    // ─────────────────────────────────────────────────────────────────────────
    const MAX_TOOL_ROUNDS = 5;
    let responseText = '';
    const toolCallsToReturn: { name: string; args: any }[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      log('PULSE-GENIE', `Tool round ${round + 1}`);

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages as any,
        tools: GROQ_TOOLS,        // ← ALWAYS provide tools so Genie can chain calls
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 4096,
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        log('PULSE-GENIE', `No response at round ${round + 1}`);
        break;
      }

      if (assistantMessage.content) {
        responseText = assistantMessage.content;
      }

      // No tool calls → Genie produced a natural text reply, we're done
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        messages.push({ role: 'assistant', content: responseText });
        log('PULSE-GENIE', `Round ${round + 1}: text-only response, done`);
        break;
      }

      log('PULSE-GENIE', `Round ${round + 1} tool calls`, {
        tools: assistantMessage.tool_calls.map((tc: any) => tc.function.name),
      });

      // Push assistant message (content + tool_calls) into history
      messages.push(assistantMessage as any);

      // Execute tools and collect results
      const toolResults: ChatMessage[] = [];
      for (const call of assistantMessage.tool_calls as GroqToolCall[]) {
        const args = JSON.parse(call.function.arguments);
        toolCallsToReturn.push({ name: call.function.name, args });

        // Side-effect: update the student knowledge model on learning signals
        if (call.function.name === 'record_learning_signal' && skillWindow) {
          try {
            await getStudentModelService().updateFromSignal(
              sessionId,
              skillWindow.data?.skillId || 'unknown',
              skillWindow.data?.graphId || 'unknown',
              {
                signalType: args.signal_type,
                topic: args.topic,
                confidence: args.confidence ?? 0.5,
                depth: args.depth,
                attempts: args.attempts,
                widgetsUsed: args.widgets_used,
                note: args.note,
              },
            );
          } catch (e) {
            log('PULSE-GENIE', 'Student model update failed (non-fatal)', { error: String(e) });
          }
        }

        // Side-effect: schedule spaced repetition when a topic is covered
        if (call.function.name === 'update_skill_progress' && args.action === 'topic_covered' && skillWindow) {
          try {
            await getSpacedRepetitionService().scheduleReview(
              sessionId,
              args.topic || 'unknown',
              skillWindow.data?.skillId || 'unknown',
              Math.max(0, Math.min(1, args.confidence ?? 0.7)),
            );
            log('PULSE-GENIE', 'Scheduled spaced repetition review', { topic: args.topic });
          } catch (e) {
            log('PULSE-GENIE', 'Spaced repetition scheduling failed (non-fatal)', { error: String(e) });
          }
        }

        toolResults.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify({
            result: getToolResult(call.function.name, args),
            success: true,
          }),
        });
      }

      // Feed results back — Genie reads these and decides whether to call more tools
      messages.push(...(toolResults as any));
    }

    const duration = Date.now() - startTime;
    log('PULSE-GENIE', 'Completed', {
      responseLength: responseText.length,
      toolCallsCount: toolCallsToReturn.length,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      response: responseText,
      toolCalls: toolCallsToReturn,
    });
  } catch (error: any) {
    log('PULSE-GENIE', 'Error', { error: error.message });
    return NextResponse.json(
      {
        error: "I'm having trouble connecting to the neural link. Let's try that again.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId && sessionMessages.has(sessionId)) {
    sessionMessages.delete(sessionId);
    log('PULSE-GENIE', 'Session cleared', { sessionId });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: 'Session not found' });
}
