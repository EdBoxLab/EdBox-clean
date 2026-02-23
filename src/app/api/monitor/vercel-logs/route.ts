import { NextRequest, NextResponse } from 'next/server';
import { logVercelEvent, is4xxPattern, send4xxAlert } from '@/lib/utils/vercel-log-monitor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, statusCode, path, method, userId, metadata } = body;

    if (!message || !statusCode) {
      return NextResponse.json(
        { error: 'Missing required fields: message, statusCode' },
        { status: 400 }
      );
    }

    await logVercelEvent(message, Number(statusCode), {
      path,
      method,
      userId,
      metadata,
    });

    if (is4xxPattern(statusCode)) {
      return NextResponse.json({
        success: true,
        alertSent: true,
        message: '4xx alert triggered'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[VercelLogMonitor] API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    monitor: 'vercel-log-monitor',
    patterns: ['4xx errors', '400 status', 'any log containing "4"'],
    endpoint: '/api/monitor/vercel-logs'
  });
}
