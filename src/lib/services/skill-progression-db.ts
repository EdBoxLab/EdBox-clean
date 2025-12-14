// ============================================
// Skill Progression Database Service
// Handles all database operations for skill progression system
// ============================================

import { supabase as supabaseClient } from '@/lib/supabase/client';
import type {
  UserSkillProgress,
  ChallengeAttempt,
  SkillConfiguration,
  RecordChallengeAttemptResponse,
  GetSkillProgressResponse,
  DifficultyLevel
} from '@/types/skill-progression';
import {
  ProgressTrackingError,
  SkillProgressionError
} from '@/types/skill-progression';

export class SkillProgressionDatabase {
  private supabase = supabaseClient;

  /**
   * Record a challenge attempt and update user progress
   */
  async recordChallengeAttempt(
    userId: string,
    skillId: string,
    challengeId: string,
    success: boolean,
    options: {
      timeSpent?: number;
      hintsUsed?: number;
      submissionCode?: string;
      feedback?: string;
      difficultyLevel?: DifficultyLevel;
    } = {}
  ): Promise<RecordChallengeAttemptResponse> {
    try {
      const { data, error } = await this.supabase.rpc('record_challenge_attempt', {
        p_user_id: userId,
        p_skill_id: skillId,
        p_challenge_id: challengeId,
        p_success: success,
        p_time_spent: options.timeSpent || null,
        p_hints_used: options.hintsUsed || 0,
        p_submission_code: options.submissionCode || null,
        p_feedback: options.feedback || null,
        p_difficulty_level: options.difficultyLevel || 'Medium'
      });

      if (error) {
        throw new ProgressTrackingError(
          `Failed to record challenge attempt: ${error.message}`,
          skillId,
          userId
        );
      }

      return data as RecordChallengeAttemptResponse;
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Database error recording challenge attempt: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Get user's progress for a specific skill
   */
  async getSkillProgress(userId: string, skillId: string): Promise<GetSkillProgressResponse> {
    try {
      const { data, error } = await this.supabase.rpc('get_skill_progress', {
        p_user_id: userId,
        p_skill_id: skillId
      });

      if (error) {
        throw new ProgressTrackingError(
          `Failed to get skill progress: ${error.message}`,
          skillId,
          userId
        );
      }

      return data as GetSkillProgressResponse;
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Database error getting skill progress: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Get all user progress records for a user
   */
  async getUserProgressAll(userId: string): Promise<UserSkillProgress[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_skill_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new ProgressTrackingError(
          `Failed to get user progress: ${error.message}`,
          'all',
          userId
        );
      }

      return data.map(this.mapUserSkillProgress);
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Database error getting user progress: ${error}`,
        'all',
        userId
      );
    }
  }

  /**
   * Get challenge attempts for a user and skill
   */
  async getChallengeAttempts(
    userId: string,
    skillId?: string,
    limit: number = 50
  ): Promise<ChallengeAttempt[]> {
    try {
      let query = this.supabase
        .from('challenge_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (skillId) {
        query = query.eq('skill_id', skillId);
      }

      const { data, error } = await query;

      if (error) {
        throw new ProgressTrackingError(
          `Failed to get challenge attempts: ${error.message}`,
          skillId || 'all',
          userId
        );
      }

      return data.map(this.mapChallengeAttempt);
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Database error getting challenge attempts: ${error}`,
        skillId || 'all',
        userId
      );
    }
  }

  /**
   * Get skill configuration
   */
  async getSkillConfiguration(skillId: string): Promise<SkillConfiguration | null> {
    try {
      const { data, error } = await this.supabase
        .from('skill_configurations')
        .select('*')
        .eq('skill_id', skillId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration found, return null
          return null;
        }
        throw new SkillProgressionError(
          `Failed to get skill configuration: ${error.message}`,
          'SKILL_CONFIG_ERROR',
          skillId
        );
      }

      return this.mapSkillConfiguration(data);
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Database error getting skill configuration: ${error}`,
        'SKILL_CONFIG_ERROR',
        skillId
      );
    }
  }

  /**
   * Create or update skill configuration
   */
  async upsertSkillConfiguration(config: Omit<SkillConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<SkillConfiguration> {
    try {
      const dbConfig = {
        skill_id: config.skillId,
        min_success_rate: config.masteryThreshold.minSuccessRate,
        challenges_required: config.masteryThreshold.challengesRequired,
        max_challenges: config.masteryThreshold.maxChallenges,
        starting_difficulty: config.difficultyProgression.startingDifficulty,
        adaptive_scaling: config.difficultyProgression.adaptiveScaling,
        challenge_types: config.challengeTypes
      };

      const { data, error } = await this.supabase
        .from('skill_configurations')
        .upsert(dbConfig, { onConflict: 'skill_id' })
        .select()
        .single();

      if (error) {
        throw new SkillProgressionError(
          `Failed to upsert skill configuration: ${error.message}`,
          'SKILL_CONFIG_ERROR',
          config.skillId
        );
      }

      return this.mapSkillConfiguration(data);
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Database error upserting skill configuration: ${error}`,
        'SKILL_CONFIG_ERROR',
        config.skillId
      );
    }
  }

  /**
   * Get multiple skill configurations
   */
  async getSkillConfigurations(skillIds: string[]): Promise<SkillConfiguration[]> {
    try {
      const { data, error } = await this.supabase
        .from('skill_configurations')
        .select('*')
        .in('skill_id', skillIds);

      if (error) {
        throw new SkillProgressionError(
          `Failed to get skill configurations: ${error.message}`,
          'SKILL_CONFIG_ERROR'
        );
      }

      return data.map(this.mapSkillConfiguration);
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Database error getting skill configurations: ${error}`,
        'SKILL_CONFIG_ERROR'
      );
    }
  }

  /**
   * Get user's mastered skills
   */
  async getMasteredSkills(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_skill_progress')
        .select('skill_id')
        .eq('user_id', userId)
        .eq('mastery_achieved', true);

      if (error) {
        throw new ProgressTrackingError(
          `Failed to get mastered skills: ${error.message}`,
          'all',
          userId
        );
      }

      return data.map(row => row.skill_id);
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Database error getting mastered skills: ${error}`,
        'all',
        userId
      );
    }
  }

  /**
   * Map database row to UserSkillProgress interface
   */
  private mapUserSkillProgress(row: Record<string, any>): UserSkillProgress {
    return {
      id: row.id,
      userId: row.user_id,
      skillId: row.skill_id,
      challengesCompleted: row.challenges_completed,
      challengesRequired: row.challenges_required,
      successRate: parseFloat(row.success_rate),
      masteryAchieved: row.mastery_achieved,
      lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined,
      totalAttempts: row.total_attempts,
      xpEarned: row.xp_earned,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to ChallengeAttempt interface
   */
  private mapChallengeAttempt(row: Record<string, any>): ChallengeAttempt {
    return {
      id: row.id,
      userId: row.user_id,
      skillId: row.skill_id,
      challengeId: row.challenge_id,
      success: row.success,
      timeSpent: row.time_spent,
      hintsUsed: row.hints_used,
      submissionCode: row.submission_code,
      feedback: row.feedback,
      difficultyLevel: row.difficulty_level as DifficultyLevel,
      timestamp: new Date(row.timestamp),
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Map database row to SkillConfiguration interface
   */
  private mapSkillConfiguration(row: Record<string, any>): SkillConfiguration {
    return {
      id: row.id,
      skillId: row.skill_id,
      masteryThreshold: {
        minSuccessRate: parseFloat(row.min_success_rate),
        challengesRequired: row.challenges_required,
        maxChallenges: row.max_challenges
      },
      difficultyProgression: {
        startingDifficulty: row.starting_difficulty as DifficultyLevel,
        adaptiveScaling: row.adaptive_scaling
      },
      challengeTypes: row.challenge_types || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export singleton instance
export const skillProgressionDb = new SkillProgressionDatabase();