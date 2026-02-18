import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from '@/app/pulse/services/genie-tooling';
import { getNextGroqKey, getGroqKeys } from '@/lib/ai-providers';

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
              required: decl.parameters?.required || []
            }
          }
        });
      }
    }
  }
  
  return tools;
}

const GROQ_TOOLS = convertToGroqTools(GENIE_TOOLS);

const sessionMessages = new Map<string, ChatMessage[]>();

function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${prefix}] ${timestamp} - ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${prefix}] ${timestamp} - ${message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { message, sessionId, currentWindows, activityContext, demoMode } = body;
    
    log('PULSE-CHAT', 'Request received', {
      messageLength: message?.length,
      sessionId,
      windowsCount: currentWindows?.length || 0,
      hasActivityContext: !!activityContext,
      demoMode
    });

    if (!message) {
      log('PULSE-CHAT', 'Error: No message provided');
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const groqKeys = getGroqKeys();
    const hasGroqKey = groqKeys.length > 0;
    
    log('PULSE-CHAT', 'Groq keys available', { keyCount: groqKeys.length });

    if (!hasGroqKey || demoMode) {
      log('PULSE-CHAT', 'Running in demo mode', { hasGroqKey, demoMode });
      
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        return NextResponse.json({
          response: "I've deployed an interactive Neuron Visualizer. Try adjusting the bias to see how it affects the activation threshold.",
          toolCalls: [{ name: 'deploy_widget', args: { widget_type: 'NEURON_VISUALIZER' } }]
        });
      }
      return NextResponse.json({
        response: "I'm The Genie. I'm here to guide you. What are we exploring today?",
        toolCalls: []
      });
    }

    let messages = sessionMessages.get(sessionId);
    if (!messages) {
      messages = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
      sessionMessages.set(sessionId, messages);
      log('PULSE-CHAT', 'New session initialized', { sessionId });
    }

    let stateContext = "";
    if (currentWindows && currentWindows.length > 0) {
      stateContext += "\n\n[ACTIVE WORKSPACE STATE]:\n";
      currentWindows.forEach((w: any) => {
        stateContext += `Widget: ${w.type} (ID: ${w.id})\n`;
        if (w.data) {
          if (w.data.code) stateContext += `Code Snippet: ${w.data.code.substring(0, 200)}...\n`;
          if (w.data.text) stateContext += `Text Content: ${w.data.text}\n`;
          if (w.data.inputs) stateContext += `Inputs: ${JSON.stringify(w.data.inputs)}\n`;
        }
        stateContext += "---\n";
      });
    }

    const fullPrompt = `${message}\n\n${activityContext || ''}${stateContext}`;
    messages.push({ role: 'user', content: fullPrompt });
    
    log('PULSE-CHAT', 'Message added to context', {
      stateContextLength: stateContext.length,
      activityContextLength: activityContext?.length || 0,
      totalMessages: messages.length
    });

    const apiKey = getNextGroqKey();
    const keyIndex = groqKeys.indexOf(apiKey);
    log('PULSE-CHAT', 'Using Groq API key', { keyIndex: keyIndex >= 0 ? keyIndex + 1 : 'unknown' });

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    log('PULSE-CHAT', 'Calling Groq API', { model: 'llama-3.3-70b-versatile' });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages as any,
      tools: GROQ_TOOLS,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096,
    });

    const assistantMessage = response.choices[0]?.message;
    
    if (!assistantMessage) {
      log('PULSE-CHAT', 'Error: No response from Groq');
      messages.pop();
      return NextResponse.json({
        error: "I'm having trouble connecting to the neural link. Let's try that again."
      }, { status: 500 });
    }

    let responseText = assistantMessage.content || "";
    const toolCallsToReturn: { name: string; args: any }[] = [];

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      log('PULSE-CHAT', 'Tool calls received', { 
        count: assistantMessage.tool_calls.length,
        tools: assistantMessage.tool_calls.map((tc: any) => tc.function.name)
      });

      const toolCallsMessage: ChatMessage = {
        role: 'assistant',
        content: assistantMessage.content || '',
        tool_call_id: undefined
      };
      
      const toolResults: ChatMessage[] = [];

      for (const call of assistantMessage.tool_calls as GroqToolCall[]) {
        const args = JSON.parse(call.function.arguments);
        toolCallsToReturn.push({ name: call.function.name, args });

        let result = 'Widget deployed successfully';
        if (call.function.name === 'write_code') result = 'Code updated in editor';
        if (call.function.name === 'run_code') result = 'Code execution started';
        if (call.function.name === 'close_widget') result = 'Widget closed';
        if (call.function.name === 'update_widget') result = 'Widget state updated';

        toolResults.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify({ result })
        });
      }

      messages.push(toolCallsMessage as any);
      messages.push(...toolResults as any);

      log('PULSE-CHAT', 'Making follow-up Groq call after tool execution');

      const finalResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 4096,
      });

      responseText = finalResponse.choices[0]?.message?.content || "";
      
      if (finalResponse.choices[0]?.message) {
        messages.push({
          role: 'assistant',
          content: responseText
        });
      }
    } else {
      messages.push({
        role: 'assistant',
        content: responseText
      });
    }

    const duration = Date.now() - startTime;
    log('PULSE-CHAT', 'Request completed', { 
      responseLength: responseText.length,
      toolCallsCount: toolCallsToReturn.length,
      duration: `${duration}ms`
    });

    return NextResponse.json({
      response: responseText,
      toolCalls: toolCallsToReturn
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('PULSE-CHAT', 'Error occurred', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    return NextResponse.json({
      error: "I'm having trouble connecting to the neural link. Let's try that again.",
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  log('PULSE-CHAT', 'Session clear requested', { sessionId });
  
  if (sessionId && sessionMessages.has(sessionId)) {
    sessionMessages.delete(sessionId);
    log('PULSE-CHAT', 'Session cleared', { sessionId });
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ success: false, message: 'Session not found' });
}