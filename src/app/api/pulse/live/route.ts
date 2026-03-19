import { NextRequest, NextResponse } from 'next/server';
import { genieToolingService } from '@/app/pulse/services/genie-tooling';
import { getNextGeminiKey, hasGeminiKey } from '@/lib/ai-providers';

function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${prefix}] ${timestamp} - ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${prefix}] ${timestamp} - ${message}`);
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    log('PULSE-LIVE', 'Configuration request received');
    
    const hasKey = hasGeminiKey();
    
    log('PULSE-LIVE', 'Gemini keys status', { hasKey });
    
    if (!hasKey) {
      log('PULSE-LIVE', 'No Gemini keys available');
      return NextResponse.json({
        error: 'Gemini API key not configured',
        configured: false
      }, { status: 400 });
    }

    const apiKey = getNextGeminiKey();
    log('PULSE-LIVE', 'Using Gemini API key', { keyObtained: !!apiKey });

    const toolingConfig = genieToolingService.getConfig();
    
    const duration = Date.now() - startTime;
    log('PULSE-LIVE', 'Configuration request completed', { duration: `${duration}ms` });
    
    return NextResponse.json({
      configured: true,
      apiKey,
      model: 'gemini-3.1-pro-preview',
      systemInstruction: toolingConfig.systemInstruction,
      tools: toolingConfig.tools,
      voiceName: 'Kore'
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('PULSE-LIVE', 'Configuration error', {
      error: error.message,
      duration: `${duration}ms`
    });
    
    return NextResponse.json({
      error: 'Failed to get live configuration',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { toolCalls } = body;
    
    log('PULSE-LIVE', 'Tool processing request received', {
      toolCallsCount: toolCalls?.length || 0
    });
    
    if (!toolCalls || !Array.isArray(toolCalls)) {
      log('PULSE-LIVE', 'Error: No tool calls provided');
      return NextResponse.json({ error: 'Tool calls are required' }, { status: 400 });
    }

    const processedResults: any[] = [];
    
    for (const call of toolCalls) {
      log('PULSE-LIVE', 'Processing tool call', {
        name: call.name,
        hasArgs: !!call.args
      });
      
      let result = 'Widget deployed successfully';
      if (call.name === 'write_code') result = 'Code updated in editor';
      if (call.name === 'run_code') result = 'Code execution started';
      if (call.name === 'close_widget') result = 'Widget closed';
      if (call.name === 'update_widget') result = 'Widget state updated';
      if (call.name === 'deploy_widget') result = 'Widget deployed successfully';
      if (call.name === 'create_custom_widget') result = 'Custom widget created';
      
      processedResults.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: { result }
        }
      });
    }
    
    const duration = Date.now() - startTime;
    log('PULSE-LIVE', 'Tool processing completed', {
      resultsCount: processedResults.length,
      duration: `${duration}ms`
    });
    
    return NextResponse.json({
      success: true,
      results: processedResults
    });
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log('PULSE-LIVE', 'Tool processing error', {
      error: error.message,
      duration: `${duration}ms`
    });
    
    return NextResponse.json({
      error: 'Failed to process tool calls',
      details: error.message
    }, { status: 500 });
  }
}