// ============================================
// Skill Progression System Setup Utilities
// Functions to initialize and seed the skill progression system
// ============================================

import { supabase } from '@/lib/supabase/client';
import type { SkillConfiguration } from '@/types/skill-progression';

/**
 * Default skill configurations for common programming skills
 */
const DEFAULT_SKILL_CONFIGS: Omit<SkillConfiguration, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    skillId: 'javascript-basics',
    masteryThreshold: {
      minSuccessRate: 0.7,
      challengesRequired: 3,
      maxChallenges: 8
    },
    difficultyProgression: {
      startingDifficulty: 'Easy',
      adaptiveScaling: true
    },
    challengeTypes: ['syntax', 'variables', 'functions', 'loops']
  },
  {
    skillId: 'python-fundamentals',
    masteryThreshold: {
      minSuccessRate: 0.7,
      challengesRequired: 3,
      maxChallenges: 8
    },
    difficultyProgression: {
      startingDifficulty: 'Easy',
      adaptiveScaling: true
    },
    challengeTypes: ['syntax', 'data-types', 'control-flow', 'functions']
  },
  {
    skillId: 'html-css-basics',
    masteryThreshold: {
      minSuccessRate: 0.6,
      challengesRequired: 2,
      maxChallenges: 6
    },
    difficultyProgression: {
      startingDifficulty: 'Easy',
      adaptiveScaling: true
    },
    challengeTypes: ['markup', 'styling', 'layout', 'responsive']
  },
  {
    skillId: 'react-components',
    masteryThreshold: {
      minSuccessRate: 0.8,
      challengesRequired: 4,
      maxChallenges: 10
    },
    difficultyProgression: {
      startingDifficulty: 'Medium',
      adaptiveScaling: true
    },
    challengeTypes: ['jsx', 'props', 'state', 'hooks', 'lifecycle']
  },
  {
    skillId: 'database-queries',
    masteryThreshold: {
      minSuccessRate: 0.75,
      challengesRequired: 3,
      maxChallenges: 7
    },
    difficultyProgression: {
      startingDifficulty: 'Medium',
      adaptiveScaling: true
    },
    challengeTypes: ['select', 'joins', 'aggregation', 'subqueries']
  },
  {
    skillId: 'algorithms-sorting',
    masteryThreshold: {
      minSuccessRate: 0.8,
      challengesRequired: 5,
      maxChallenges: 10
    },
    difficultyProgression: {
      startingDifficulty: 'Hard',
      adaptiveScaling: true
    },
    challengeTypes: ['bubble-sort', 'merge-sort', 'quick-sort', 'heap-sort']
  },
  {
    skillId: 'data-structures',
    masteryThreshold: {
      minSuccessRate: 0.8,
      challengesRequired: 5,
      maxChallenges: 10
    },
    difficultyProgression: {
      startingDifficulty: 'Hard',
      adaptiveScaling: true
    },
    challengeTypes: ['arrays', 'linked-lists', 'trees', 'graphs', 'hash-tables']
  }
];

/**
 * Initialize the skill progression system by seeding default configurations
 */
export async function initializeSkillProgressionSystem(): Promise<void> {
  try {
    console.log('Initializing skill progression system...');

    // Check if configurations already exist
    const { data: existingConfigs, error: checkError } = await supabase
      .from('skill_configurations')
      .select('skill_id')
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check existing configurations: ${checkError.message}`);
    }

    if (existingConfigs && existingConfigs.length > 0) {
      console.log('Skill configurations already exist, skipping initialization.');
      return;
    }

    // Insert default configurations
    const configsToInsert = DEFAULT_SKILL_CONFIGS.map(config => ({
      skill_id: config.skillId,
      min_success_rate: config.masteryThreshold.minSuccessRate,
      challenges_required: config.masteryThreshold.challengesRequired,
      max_challenges: config.masteryThreshold.maxChallenges,
      starting_difficulty: config.difficultyProgression.startingDifficulty,
      adaptive_scaling: config.difficultyProgression.adaptiveScaling,
      challenge_types: config.challengeTypes
    }));

    const { error: insertError } = await supabase
      .from('skill_configurations')
      .insert(configsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert skill configurations: ${insertError.message}`);
    }

    console.log(`Successfully initialized ${DEFAULT_SKILL_CONFIGS.length} skill configurations.`);
  } catch (error) {
    console.error('Failed to initialize skill progression system:', error);
    throw error;
  }
}

/**
 * Verify that the skill progression system tables exist and are accessible
 */
export async function verifySkillProgressionTables(): Promise<boolean> {
  try {
    // Test each table by attempting a simple query
    const tables = [
      'user_skill_progress',
      'challenge_attempts',
      'skill_configurations'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`Table ${table} is not accessible:`, error.message);
        return false;
      }
    }

    console.log('All skill progression tables are accessible.');
    return true;
  } catch (error) {
    console.error('Failed to verify skill progression tables:', error);
    return false;
  }
}

/**
 * Get system statistics for monitoring
 */
export async function getSkillProgressionStats(): Promise<{
  totalUsers: number;
  totalSkills: number;
  totalAttempts: number;
  masteredSkills: number;
}> {
  try {
    // Get total unique users with progress
    const { count: totalUsers } = await supabase
      .from('user_skill_progress')
      .select('user_id', { count: 'exact', head: true });

    // Get total configured skills
    const { count: totalSkills } = await supabase
      .from('skill_configurations')
      .select('*', { count: 'exact', head: true });

    // Get total challenge attempts
    const { count: totalAttempts } = await supabase
      .from('challenge_attempts')
      .select('*', { count: 'exact', head: true });

    // Get total mastered skills
    const { count: masteredSkills } = await supabase
      .from('user_skill_progress')
      .select('*', { count: 'exact', head: true })
      .eq('mastery_achieved', true);

    return {
      totalUsers: totalUsers || 0,
      totalSkills: totalSkills || 0,
      totalAttempts: totalAttempts || 0,
      masteredSkills: masteredSkills || 0
    };
  } catch (error) {
    console.error('Failed to get skill progression stats:', error);
    return {
      totalUsers: 0,
      totalSkills: 0,
      totalAttempts: 0,
      masteredSkills: 0
    };
  }
}

/**
 * Reset user progress for a specific skill (admin function)
 */
export async function resetUserSkillProgress(userId: string, skillId: string): Promise<void> {
  try {
    // Delete progress record
    const { error: progressError } = await supabase
      .from('user_skill_progress')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    if (progressError) {
      throw new Error(`Failed to delete progress: ${progressError.message}`);
    }

    // Delete challenge attempts
    const { error: attemptsError } = await supabase
      .from('challenge_attempts')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    if (attemptsError) {
      throw new Error(`Failed to delete attempts: ${attemptsError.message}`);
    }

    console.log(`Reset progress for user ${userId} on skill ${skillId}`);
  } catch (error) {
    console.error('Failed to reset user skill progress:', error);
    throw error;
  }
}