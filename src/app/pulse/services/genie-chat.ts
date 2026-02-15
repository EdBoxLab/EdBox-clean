
import { GoogleGenAI } from "@google/genai";
import { PulseWindow } from '../types';
import { genieToolingService } from './genie-tooling';
import { interactionTracker } from './interaction-tracker';

const API_KEY = process.env.API_KEY || '';

class GenieChatService {
  private ai: GoogleGenAI | null = null;
  private chat: any = null;

  constructor() {
    if (API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: API_KEY });
        const config = genieToolingService.getConfig();
        
        this.chat = this.ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: config.systemInstruction,
                tools: config.tools,
            }
        });
      } catch (error) {
        console.error("Failed to initialize Genie Chat:", error);
      }
    }
  }

  /**
   * Sends a message to the Genie.
   */
  async sendMessage(message: string, currentWindows: PulseWindow[], onToolCall: (toolName: string, args: any) => void): Promise<string> {
    if (!this.chat) {
      // Fallback simulation
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        setTimeout(() => onToolCall('deploy_widget', { widget_type: 'NEURON_VISUALIZER' }), 800);
        return "I've deployed an interactive Neuron Visualizer. Try adjusting the bias to see how it affects the activation threshold.";
      }
      return "I'm The Genie. I'm here to guide you. What are we exploring today?";
    }

    // 1. Get User Activity Context from Tracker
    const activityContext = interactionTracker.getContextSummary();

    // 2. Get Workspace State Context
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

    try {
      // Combine all context
      const fullPrompt = `${message}\n\n${activityContext}${stateContext}`;

      // 3. Send Message
      const result = await this.chat.sendMessage({ message: fullPrompt });
      
      // 4. Handle Tool Calls
      // CRITICAL FIX: Check functionCalls BEFORE accessing .text to prevent SDK errors/warnings with mixed content
      const toolCalls = result.functionCalls;
      let responseText = "";
      
      if (toolCalls && toolCalls.length > 0) {
          const toolResponses = await genieToolingService.processToolCalls(toolCalls, onToolCall);
          const finalResult = await this.chat.sendMessage({ message: toolResponses });
          responseText = finalResult.text || "";
      } else {
          // Only access text if no tools were called, ensuring we don't trigger the "non-text parts" warning
          responseText = result.text || "";
      }

      return responseText;

    } catch (error: any) {
      console.error("Genie Chat Error:", error);
      return "I'm having trouble connecting to the neural link. Let's try that again.";
    }
  }
}

export const genieChatService = new GenieChatService();
