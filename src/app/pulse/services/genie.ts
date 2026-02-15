
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from './genie-tooling';
import { PulseWindow } from '../types';

const API_KEY = process.env.API_KEY || ''; // Injected by environment

class GenieService {
  private ai: GoogleGenAI | null = null;
  private chat: any = null;

  constructor() {
    if (API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: API_KEY });
        this.chat = this.ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: GENIE_TOOLS,
            }
        });
      } catch (error) {
        console.error("Failed to initialize Genie:", error);
      }
    }
  }

  async sendMessage(message: string, currentWindows: PulseWindow[], onToolCall: (toolName: string, args: any) => void): Promise<string> {
    if (!this.chat) {
      // Fallback simulation for when no API key is present (Demo Mode)
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        setTimeout(() => onToolCall('deploy_neuron_visualizer', { topic: 'Neuron' }), 800);
        return "I've deployed an interactive Neuron Visualizer. Try adjusting the bias to see how it affects the activation threshold.";
      }
      if (message.toLowerCase().includes('code')) {
         setTimeout(() => onToolCall('deploy_code_editor', { language: 'javascript' }), 800);
         return "Opening the code sandbox. Let's write some code together.";
      }
      return "I'm The Genie. I'm here to guide you. What are we exploring today?";
    }

    // Construct Context String from open windows
    let contextString = "";
    if (currentWindows.length > 0) {
        contextString += "\n\n[CURRENT WORKSPACE STATE]:\n";
        currentWindows.forEach(w => {
            contextString += `Widget Type: ${w.type}\nTitle: ${w.title}\nID: ${w.id}\n`;
            if (w.data) {
                if (w.data.code) contextString += `Current Code/Content:\n${w.data.code}\n`;
                if (w.data.text) contextString += `Current Text:\n${w.data.text}\n`;
            }
            contextString += "---\n";
        });
    }

    try {
      // Append context to the user message so the model sees it
      const messageWithContext = message + contextString;

      const result = await this.chat.sendMessage({ message: messageWithContext });
      
      // CRITICAL FIX: Check functionCalls BEFORE accessing .text to prevent SDK errors/warnings with mixed content
      const toolCalls = result.functionCalls;
      let responseText = "";

      if (toolCalls && toolCalls.length > 0) {
          // Process tool calls
          for(const call of toolCalls) {
              onToolCall(call.name, call.args);
          }
          
          // Send tool response back to model to get final text
          const responseParts = toolCalls.map((call: any) => {
              let result = 'Widget deployed successfully';
              if (call.name === 'write_code') result = 'Code updated in editor';
              if (call.name === 'run_code') result = 'Code execution started';
              if (call.name === 'close_widget') result = 'Widget closed';

              return {
                functionResponse: {
                    id: call.id,
                    name: call.name,
                    response: { result }
                }
              };
          });
          
          const finalResult = await this.chat.sendMessage({ message: responseParts });
          responseText = finalResult.text || "";
      } else {
          // Only access text if no tools were called
          responseText = result.text || "";
      }

      return responseText;

    } catch (error: any) {
      console.error("Genie Error:", error);
      return "I'm having trouble connecting to the neural link. Let's try that again.";
    }
  }
}

export const genieService = new GenieService();
