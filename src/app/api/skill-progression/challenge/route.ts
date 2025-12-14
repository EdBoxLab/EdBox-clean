import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { challengeGenerator } from '@/lib/services/challenge-generator';
import type { ChallengeGenerationRequest, DifficultyLevel } from '@/types/skill-progression';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skillId, difficultyLevel, challengeType, action } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate': {
        if (!difficultyLevel) {
          return NextResponse.json({ error: 'Difficulty level is required for generation' }, { status: 400 });
        }

        const request: ChallengeGenerationRequest = {
          skillId,
          difficultyLevel: difficultyLevel as DifficultyLevel,
          challengeType,
          userHistory: [] // Could be populated from database
        };

        const challenge = await challengeGenerator.generateChallenge(request);
        
        return NextResponse.json({
          success: true,
          challenge
        });
      }

      case 'getPool': {
        const challenges = await challengeGenerator.getChallengePool(skillId);
        
        return NextResponse.json({
          success: true,
          challenges,
          count: challenges.length
        });
      }

      case 'ensurePool': {
        const { targetSize = 3 } = body;
        
        await challengeGenerator.ensurePoolSize(skillId, targetSize);
        const challenges = await challengeGenerator.getChallengePool(skillId);
        
        return NextResponse.json({
          success: true,
          message: `Pool ensured for skill ${skillId}`,
          challenges,
          count: challenges.length
        });
      }

      case 'generateVaried': {
        const { count = 3, difficultyLevel: difficulty = 'Medium' } = body;
        
        const challenges = await challengeGenerator.generateVariedChallenges(
          skillId,
          count,
          difficulty as DifficultyLevel
        );
        
        return NextResponse.json({
          success: true,
          challenges,
          count: challenges.length
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Challenge generation API error:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to process challenge request',
      type: error.constructor.name
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID is required' }, { status: 400 });
    }

    const challenges = await challengeGenerator.getChallengePool(skillId);
    
    return NextResponse.json({
      success: true,
      skillId,
      challenges,
      count: challenges.length
    });

  } catch (error: any) {
    console.error('Challenge pool retrieval error:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to retrieve challenge pool'
    }, { status: 500 });
  }
}