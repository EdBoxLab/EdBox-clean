import { NextRequest, NextResponse } from 'next/server';
import { InteractiveCourseSessionManager } from '@/lib/services/interactive-course-session-manager';

const sessionManager = new InteractiveCourseSessionManager(true);

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and courseId' },
        { status: 400 }
      );
    }

    // Try to resume existing session
    const existingSession = await sessionManager.resumeSession(userId, courseId);
    
    if (!existingSession) {
      return NextResponse.json(
        { error: 'No existing session found' },
        { status: 404 }
      );
    }

    // Get recent conversation history
    const messages = await sessionManager.getSessionHistory(existingSession.id, 20);

    return NextResponse.json({
      success: true,
      session: existingSession,
      messages
    });

  } catch (error) {
    console.error('Failed to resume interactive course session:', error);
    return NextResponse.json(
      { error: 'Failed to resume session' },
      { status: 500 }
    );
  }
}