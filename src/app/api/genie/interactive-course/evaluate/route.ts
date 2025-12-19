import { NextRequest, NextResponse } from 'next/server';
import { understandingAssessment } from '@/lib/services/understanding-assessment';
import { adaptiveResponseSystem } from '@/lib/services/adaptive-response-system';
import { sessionManager } from '@/lib/services/interactive-course-session-manager';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer } = await request.json();

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, questionId, and answer' },
        { status: 400 }
      );
    }

    // Evaluate the response
    const comprehensionResult = await understandingAssessment.evaluateResponse(questionId, answer);
    
    // Get session data for adaptive response
    const resumeData = await sessionManager.getSessionResumeData(sessionId);
    const session = resumeData.session;

    // Generate adaptive response based on comprehension
    const adaptiveResponse = await adaptiveResponseSystem.generateAdaptiveResponse(
      [comprehensionResult],
      session.learningContext,
      session.currentTopic || 'Current Topic'
    );

    // Update session with new comprehension data
    const updatedContext = {
      ...session.learningContext,
      comprehensionLevel: await understandingAssessment.evaluateComprehensionLevel(
        [comprehensionResult],
        session.learningContext
      )
    };

    // Update struggling or mastered concepts based on result
    if (comprehensionResult.correct) {
      const concept = session.currentTopic || 'Current Concept';
      if (!updatedContext.masteredConcepts.includes(concept)) {
        updatedContext.masteredConcepts.push(concept);
      }
      updatedContext.strugglingAreas = updatedContext.strugglingAreas.filter(
        area => area !== concept
      );
    } else {
      const concept = session.currentTopic || 'Current Concept';
      if (!updatedContext.strugglingAreas.includes(concept)) {
        updatedContext.strugglingAreas.push(concept);
      }
    }

    // Persist updated session
    session.learningContext = updatedContext;
    await sessionManager.persistSession(session);

    return NextResponse.json({
      success: true,
      evaluation: comprehensionResult,
      feedback: adaptiveResponse.content,
      nextAction: adaptiveResponse.nextAction,
      updatedContext
    });

  } catch (error) {
    console.error('Failed to evaluate assessment:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate assessment' },
      { status: 500 }
    );
  }
}