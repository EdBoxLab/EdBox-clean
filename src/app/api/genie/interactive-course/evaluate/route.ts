import { NextRequest, NextResponse } from 'next/server';
import { understandingAssessment } from '@/lib/services/understanding-assessment';
import { adaptiveResponseSystem } from '@/lib/services/adaptive-response-system';
import { InteractiveCourseSessionManager } from '@/lib/services/interactive-course-session-manager';
import { SessionManager } from '@/lib/genie/brain/session';

const sessionManager = new InteractiveCourseSessionManager(true);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer, iterationId } = await request.json();

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

    // Update progress state counters
    if (session.progressState) {
      session.progressState.assessmentsCompleted = (session.progressState.assessmentsCompleted || 0) + 1;
      // Update mastered/struggling skills in progress state too
      const concept = session.currentTopic || 'Current Concept';
      if (comprehensionResult.correct) {
        if (!session.progressState.masteredSkills.includes(concept)) {
          session.progressState.masteredSkills.push(concept);
        }
        session.progressState.strugglingSkills = session.progressState.strugglingSkills.filter(s => s !== concept);
      } else {
        if (!session.progressState.strugglingSkills.includes(concept)) {
          session.progressState.strugglingSkills.push(concept);
        }
      }
    }

    await sessionManager.persistSession(session);

    // Update learning_loop_iterations if iterationId is provided
    if (iterationId) {
      try {
        const masteryAchieved = comprehensionResult.correct;
        await SessionManager.markEvaluationCompleted(iterationId, masteryAchieved);
      } catch (iterError) {
        console.error('Failed to update iteration:', iterError);
      }
    }

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