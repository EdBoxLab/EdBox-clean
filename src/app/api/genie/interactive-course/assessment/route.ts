import { NextRequest, NextResponse } from 'next/server';
import { understandingAssessment } from '@/lib/services/understanding-assessment';
import { DifficultyLevel } from '@/types/interactive-course';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, concept, difficulty = 'Medium' } = await request.json();

    if (!sessionId || !concept) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and concept' },
        { status: 400 }
      );
    }

    // Create a quick check question
    const question = await understandingAssessment.createQuickCheck(
      concept, 
      difficulty as DifficultyLevel
    );

    return NextResponse.json({
      success: true,
      question
    });

  } catch (error) {
    console.error('Failed to create assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}