import { NextRequest, NextResponse } from 'next/server';
import { conversationEngine } from '@/lib/services/conversation-engine';

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and courseId' },
        { status: 400 }
      );
    }

    // Initialize new interactive course session
    const session = await conversationEngine.initializeSession(courseId, userId);
    
    // Get initial messages (welcome message should be added by initializeSession)
    const messages: any[] = []; // In production, this would fetch from database

    return NextResponse.json({
      success: true,
      session,
      messages
    });

  } catch (error) {
    console.error('Failed to create interactive course session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}