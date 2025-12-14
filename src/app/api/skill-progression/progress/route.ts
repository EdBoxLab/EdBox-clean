import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { progressTracker } from '@/lib/services/progress-tracker';
import { skillProgressionIntegration } from '@/lib/services/skill-progression-integration';
import type { DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph } from '@/lib/services/skill-progression-manager';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'recordAttempt': {
        const {
          skillId,
          challengeId,
          success,
          timeSpent,
          hintsUsed,
          submissionCode,
          feedback,
          difficultyLevel,
          skillGraph
        } = body;

        if (!skillId || !challengeId || typeof success !== 'boolean') {
          return NextResponse.json({
            error: 'skillId, challengeId, and success are required'
          }, { status: 400 });
        }

        const result = await skillProgressionIntegration.recordChallengeAttempt(
          user.id,
          skillId,
          challengeId,
          success,
          skillGraph as SkillGraph,
          {
            timeSpent,
            hintsUsed,
            submissionCode,
            feedback,
            difficultyLevel: difficultyLevel as DifficultyLevel
          }
        );

        return NextResponse.json({
          success: true,
          result: result.result,
          unlockedSkills: result.unlockedSkills,
          masteryAchieved: result.result.masteryAchieved,
          xpAwarded: result.result.xpAwarded
        });
      }

      case 'getProgressSummary': {
        const { skillId } = body;

        if (!skillId) {
          return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
        }

        const summary = await progressTracker.getProgressSummary(user.id, skillId);

        return NextResponse.json({
          success: true,
          summary
        });
      }

      case 'getProgressDisplayData': {
        const { skillId, skillTitle } = body;

        if (!skillId || !skillTitle) {
          return NextResponse.json({
            error: 'skillId and skillTitle are required'
          }, { status: 400 });
        }

        const displayData = await progressTracker.getProgressDisplayData(
          user.id,
          skillId,
          skillTitle
        );

        return NextResponse.json({
          success: true,
          displayData
        });
      }

      case 'getMultipleProgressData': {
        const { skillGraph } = body;

        if (!skillGraph) {
          return NextResponse.json({ error: 'skillGraph is required' }, { status: 400 });
        }

        const progressData = await skillProgressionIntegration.getSkillProgressData(
          user.id,
          skillGraph as SkillGraph
        );

        return NextResponse.json({
          success: true,
          progressData
        });
      }

      case 'getTotalXP': {
        const totalXP = await progressTracker.getTotalUserXP(user.id);
        const xpRank = await progressTracker.getUserXPRank(user.id);

        return NextResponse.json({
          success: true,
          totalXP,
          rank: xpRank
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Progress tracking API error:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to process progress request',
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
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        if (!skillId) {
          return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
        }

        const summary = await progressTracker.getProgressSummary(user.id, skillId);

        return NextResponse.json({
          success: true,
          skillId,
          summary
        });
      }

      case 'totalXP': {
        const totalXP = await progressTracker.getTotalUserXP(user.id);
        const xpRank = await progressTracker.getUserXPRank(user.id);

        return NextResponse.json({
          success: true,
          totalXP,
          rank: xpRank
        });
      }

      case 'xpConfig': {
        const xpConfig = progressTracker.getXPConfig();

        return NextResponse.json({
          success: true,
          xpConfig
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Progress retrieval API error:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to retrieve progress data'
    }, { status: 500 });
  }
}