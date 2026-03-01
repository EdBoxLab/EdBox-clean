
import { PulseWindow } from '../types';
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from './genie-tooling';
import { interactionTracker } from './interaction-tracker';
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

class GenieChatService {
  private messages: ChatMessage[] = [];
  private isInitialized = false;

  private initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.messages = [{
      role: 'system',
      content: SYSTEM_INSTRUCTION
    }];
  }

  private hasGroqKey(): boolean {
    return getGroqKeys().length > 0;
  }

  async sendMessage(message: string, currentWindows: PulseWindow[], onToolCall: (toolName: string, args: any) => void): Promise<string> {
    this.initialize();

    if (!this.hasGroqKey()) {
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        setTimeout(() => onToolCall('deploy_widget', { widget_type: 'NEURON_VISUALIZER' }), 800);
        return "I've deployed an interactive Neuron Visualizer. Try adjusting the bias to see how it affects the activation threshold.";
      }
      return "I'm The Genie. I'm here to guide you. What are we exploring today?";
    }

    const activityContext = interactionTracker.getContextSummary();

    let stateContext = "";
    if (currentWindows.length > 0) {
      stateContext += "\n\n[ACTIVE WORKSPACE STATE]:\n";
      currentWindows.forEach(w => {
        stateContext += `Widget: ${w.type} (ID: ${w.id})\n`;
        if (w.data) {
          if (w.data.code) stateContext += `Code Snippet: ${w.data.code.substring(0, 200)}...\n`;
          if (w.data.text) stateContext += `Text Content: ${w.data.text}\n`;
          if (w.data.inputs) stateContext += `Inputs: ${JSON.stringify(w.data.inputs)}\n`;
        }
        stateContext += "---\n";
      });
    }

    const fullPrompt = `${message}\n\n${activityContext}${stateContext}`;
    this.messages.push({ role: 'user', content: fullPrompt });

    try {
      const Groq = (await import('groq-sdk')).default;
      const apiKey = getNextGroqKey();
      const groq = new Groq({ apiKey });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: this.messages as any,
        tools: GROQ_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 4096,
      });

      const assistantMessage = response.choices[0]?.message;

      if (!assistantMessage) {
        return "I'm having trouble connecting to the neural link. Let's try that again.";
      }

      let responseText = assistantMessage.content || "";

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCallsMessage: ChatMessage = {
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_call_id: undefined
        };

        const toolResults: ChatMessage[] = [];

        for (const call of assistantMessage.tool_calls as GroqToolCall[]) {
          const args = JSON.parse(call.function.arguments);
          onToolCall(call.function.name, args);

          let result = 'Widget deployed successfully';
          if (call.function.name === 'write_code') result = 'Code updated in editor';
          if (call.function.name === 'run_code') result = 'Code execution started';
          if (call.function.name === 'close_widget') result = 'Widget closed';
          if (call.function.name === 'update_widget') result = 'Widget state updated';
          if (call.function.name === 'update_skill_progress') result = `Skill progress updated: ${args.action || 'unknown'}${args.topic ? ' - ' + args.topic : ''}`;

          toolResults.push({
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify({ result })
          });
        }

        this.messages.push(toolCallsMessage as any);
        this.messages.push(...toolResults as any);

        const finalResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: this.messages as any,
          tools: GROQ_TOOLS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 4096,
        });

        responseText = finalResponse.choices[0]?.message?.content || "";

        if (finalResponse.choices[0]?.message) {
          this.messages.push({
            role: 'assistant',
            content: responseText
          });
        }
      } else {
        this.messages.push({
          role: 'assistant',
          content: responseText
        });
      }

      return responseText;

    } catch (error: any) {
      console.error("Genie Chat Error:", error);
      this.messages.pop();
      return "I'm having trouble connecting to the neural link. Let's try that again.";
    }
  }
}

export const genieChatService = new GenieChatService();
