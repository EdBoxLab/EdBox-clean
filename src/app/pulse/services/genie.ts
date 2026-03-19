import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from './genie-tooling';
import { PulseWindow } from '../types';
import { getNextGeminiKey, getGeminiKeys } from '@/lib/ai-providers';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: any[];
}

class GenieService {
  private history: GeminiMessage[] = [];
  private isInitialized = false;

  private initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.history = [];
  }

  async sendMessage(message: string, currentWindows: PulseWindow[], onToolCall: (toolName: string, args: any) => void): Promise<string> {
    this.initialize();

    if (getGeminiKeys().length === 0) {
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

    const messageWithContext = message + contextString;
    this.history.push({ role: 'user', parts: [{ text: messageWithContext }] });

    try {
      const apiKey = getNextGeminiKey();
      if (!apiKey) throw new Error('No Gemini keys available');

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-pro-preview',
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: GENIE_TOOLS as any,
      });

      const result = await model.generateContent({
        contents: this.history,
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      });

      const response = result.response;
      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error('No response from Gemini');

      const functionCalls = candidate.content?.parts?.filter((p: any) => p.functionCall) || [];
      const textParts = candidate.content?.parts?.filter((p: any) => p.text) || [];
      let responseText = textParts.map((p: any) => p.text).join('') || '';

      this.history.push({
        role: 'model',
        parts: candidate.content?.parts || [{ text: responseText }]
      });

      if (functionCalls.length > 0) {
        for (const part of functionCalls) {
          const fc = (part as any).functionCall;
          onToolCall(fc.name, fc.args);
        }

        const functionResponses = functionCalls.map((part: any) => {
          const fc = part.functionCall;
          let resultText = 'Widget deployed successfully';
          if (fc.name === 'write_code') resultText = 'Code updated in editor';
          if (fc.name === 'run_code') resultText = 'Code execution started';
          if (fc.name === 'close_widget') resultText = 'Widget closed';
          if (fc.name === 'update_widget') resultText = 'Widget state updated';
          return {
            functionResponse: {
              name: fc.name,
              response: { result: resultText }
            }
          };
        });

        this.history.push({ role: 'user', parts: functionResponses });

        const followUp = await model.generateContent({
          contents: this.history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        });

        const followUpCandidate = followUp.response.candidates?.[0];
        if (followUpCandidate) {
          const followUpText = followUpCandidate.content?.parts
            ?.filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join('') || '';

          if (followUpText) {
            this.history.push({
              role: 'model',
              parts: followUpCandidate.content?.parts || [{ text: followUpText }]
            });
            responseText = responseText ? `${responseText}\n\n${followUpText}` : followUpText;
          }
        }
      }

      return responseText;
    } catch (error: any) {
      console.error("Gemini failed:", error);
      this.history.pop();
      return "I'm having trouble connecting to the neural link. Let's try that again.";
    }
  }
}

export const genieService = new GenieService();
