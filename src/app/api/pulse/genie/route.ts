import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from '@/app/pulse/services/genie-tooling';
import { getNextGeminiKey, getGeminiKeys } from '@/lib/ai-providers';

interface ChatMessage {
  role: 'user' | 'model';
  parts: any[];
}

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
    const { message, sessionId, currentWindows, demoMode } = body;

    log('PULSE-GENIE', 'Request received', {
      messageLength: message?.length,
      sessionId,
      windowsCount: currentWindows?.length || 0,
      demoMode
    });

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0 || demoMode) {
      log('PULSE-GENIE', 'Running in demo mode');
      if (message.toLowerCase().includes('neuron') || message.toLowerCase().includes('brain')) {
        return NextResponse.json({
          response: "I've deployed an interactive Neuron Visualizer. Try adjusting the bias to see how it affects the activation threshold.",
          toolCalls: [{ name: 'deploy_neuron_visualizer', args: { topic: 'Neuron' } }]
        });
      }
      if (message.toLowerCase().includes('code')) {
        return NextResponse.json({
          response: "Opening the code sandbox. Let's write some code together.",
          toolCalls: [{ name: 'deploy_code_editor', args: { language: 'javascript' } }]
        });
      }
      return NextResponse.json({
        response: "I'm The Genie. I'm here to guide you. What are we exploring today?",
        toolCalls: []
      });
    }

    let history = sessionMessages.get(sessionId);
    if (!history) {
      history = [];
      sessionMessages.set(sessionId, history);
      log('PULSE-GENIE', 'New session initialized', { sessionId });
    }

    let contextString = "";
    if (currentWindows && currentWindows.length > 0) {
      contextString += "\n\n[CURRENT WORKSPACE STATE]:\n";
      currentWindows.forEach((w: any) => {
        contextString += `Widget Type: ${w.type}\nTitle: ${w.title}\nID: ${w.id}\n`;
        if (w.data) {
          if (w.data.code) contextString += `Current Code/Content:\n${w.data.code}\n`;
          if (w.data.text) contextString += `Current Text:\n${w.data.text}\n`;
        }
        contextString += "---\n";
      });
    }

    const messageWithContext = message + contextString;
    history.push({ role: 'user', parts: [{ text: messageWithContext }] });

    const apiKey = getNextGeminiKey();
    log('PULSE-GENIE', 'Using Gemini 2.5 Flash');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: GENIE_TOOLS as any,
    });

    const result = await model.generateContent({
      contents: history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    });

    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      history.pop();
      return NextResponse.json({
        error: "I'm having trouble connecting to the neural link. Let's try that again."
      }, { status: 500 });
    }

    const functionCalls = candidate.content?.parts?.filter((p: any) => p.functionCall) || [];
    const textParts = candidate.content?.parts?.filter((p: any) => p.text) || [];
    const responseText = textParts.map((p: any) => p.text).join('') || '';

    const toolCallsToReturn: { name: string; args: any }[] = [];
    for (const part of functionCalls) {
      const fc = (part as any).functionCall;
      toolCallsToReturn.push({ name: fc.name, args: fc.args });
    }

    history.push({
      role: 'model',
      parts: candidate.content?.parts || [{ text: responseText }]
    });

    if (functionCalls.length > 0) {
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

      history.push({ role: 'user', parts: functionResponses });

      const followUp = await model.generateContent({
        contents: history,
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      });

      const followUpCandidate = followUp.response.candidates?.[0];
      if (followUpCandidate) {
        const followUpText = followUpCandidate.content?.parts
          ?.filter((p: any) => p.text)
          .map((p: any) => p.text)
          .join('') || '';

        if (followUpText) {
          history.push({
            role: 'model',
            parts: followUpCandidate.content?.parts || [{ text: followUpText }]
          });
          const finalText = responseText ? `${responseText}\n\n${followUpText}` : followUpText;
          const duration = Date.now() - startTime;
          log('PULSE-GENIE', 'Request completed with tool follow-up', { duration: `${duration}ms` });
          return NextResponse.json({ response: finalText, toolCalls: toolCallsToReturn });
        }
      }
    }

    const duration = Date.now() - startTime;
    log('PULSE-GENIE', 'Request completed', {
      responseLength: responseText.length,
      toolCallsCount: toolCallsToReturn.length,
      duration: `${duration}ms`
    });

    return NextResponse.json({ response: responseText, toolCalls: toolCallsToReturn });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('PULSE-GENIE', 'Error occurred', { error: error.message, duration: `${duration}ms` });
    return NextResponse.json({
      error: "I'm having trouble connecting to the neural link. Let's try that again.",
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (sessionId && sessionMessages.has(sessionId)) {
    sessionMessages.delete(sessionId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: 'Session not found' });
}
