import { NextRequest, NextResponse } from 'next/server';
import { logErrorToSupport } from '@/lib/utils/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const { error, stack, componentStack } = await req.json();
    
    await logErrorToSupport({
      timestamp: new Date().toISOString(),
      error,
      stack: stack || componentStack,
      path: req.headers.get('referer') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
