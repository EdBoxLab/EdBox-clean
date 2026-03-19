import { PulseWindow } from '../types';
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from './genie-tooling';
import { interactionTracker } from './interaction-tracker';
import { getNextGeminiKey, getGeminiKeys } from '@/lib/ai-providers';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: any[];
}

class GenieChatService {
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
    this.history.push({ role: 'user', parts: [{ text: fullPrompt }] });

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
          if (fc.name === 'update_skill_progress') resultText = `Skill progress updated: ${fc.args?.action || 'unknown'}${fc.args?.topic ? ' - ' + fc.args.topic : ''}`;
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

export const genieChatService = new GenieChatService();
