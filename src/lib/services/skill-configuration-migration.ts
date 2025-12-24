// ============================================
// Skill Configuration Migration Utilities
// Handles migration of user progress when configurations change
// ============================================

import { supabase as supabaseClient } from '@/lib/supabase/client';
import type {
  SkillConfiguration,
  UserSkillProgress
} from '@/types/skill-progression';
import {
  SkillProgressionError
} from '@/types/skill-progression';

/**
 * Migration strategy for configuration changes
 */
export interface MigrationStrategy {
  type: 'preserve' | 'recalculate' | 'reset' | 'manual_review';
  reason: string;
  affectedUsers?: number;
  recommendations: string[];
}

/**
 * Migration execution result
 */
export interface MigrationExecutionResult {
  success: boolean;
  strategy: MigrationStrategy;
  usersProcessed: number;
  usersUpdated: number;
  errors: string[];
  warnings: string[];
}

/**
 * Service for handling configuration migrations
 */
export class SkillConfigurationMigration {
  private supabase = supabaseClient;

  /**
   * Analyze the impact of a configuration change
   */
  async analyzeMigrationImpact(
    skillId: string,
    oldConfig: SkillConfiguration,
    newConfig: SkillConfiguration
  ): Promise<MigrationStrategy> {
    try {
      // Get count of users with progress on this skill
      const { data: progressData, error } = await this.supabase
        .from('user_skill_progress')
        .select('id, mastery_achieved, challenges_completed, success_rate')
        .eq('skill_id', skillId);

      if (error) {
        throw new SkillProgressionError(
          `Failed to analyze migration impact: ${error.message}`,
          'MIGRATION_ANALYSIS_ERROR',
          skillId
        );
      }

      const affectedUsers = progressData?.length || 0;
      const masteredUsers = progressData?.filter((p: any) => p.mastery_achieved).length || 0;
      const inProgressUsers = affectedUsers - masteredUsers;

      // Analyze configuration changes
      const successRateChanged = oldConfig.masteryThreshold.minSuccessRate !== newConfig.masteryThreshold.minSuccessRate;
      const challengesRequiredChanged = oldConfig.masteryThreshold.challengesRequired !== newConfig.masteryThreshold.challengesRequired;
      const maxChallengesChanged = oldConfig.masteryThreshold.maxChallenges !== newConfig.masteryThreshold.maxChallenges;

      const isMoreRestrictive = 
        newConfig.masteryThreshold.minSuccessRate > oldConfig.masteryThreshold.minSuccessRate ||
        newConfig.masteryThreshold.challengesRequired > oldConfig.masteryThreshold.challengesRequired;

      const isLessRestrictive = 
        newConfig.masteryThreshold.minSuccessRate < oldConfig.masteryThreshold.minSuccessRate ||
        newConfig.masteryThreshold.challengesRequired < oldConfig.masteryThreshold.challengesRequired;

      // Determine migration strategy
      if (!successRateChanged && !challengesRequiredChanged) {
        // Only non-critical changes (max challenges, difficulty, etc.)
        return {
          type: 'preserve',
          reason: 'Only non-critical configuration changes detected',
          affectedUsers,
          recommendations: [
            'No user progress migration required',
            'Changes will apply to new challenge generation only'
          ]
        };
      }

      if (isMoreRestrictive && masteredUsers > 0) {
        // More restrictive changes with existing mastered users
        return {
          type: 'manual_review',
          reason: 'More restrictive requirements may invalidate existing mastery',
          affectedUsers,
          recommendations: [
            `${masteredUsers} users have already achieved mastery`,
            'Consider grandfathering existing mastery or requiring re-validation',
            'Manual review recommended for fairness'
          ]
        };
      }

      if (isLessRestrictive && inProgressUsers > 0) {
        // Less restrictive - some users might now qualify for mastery
        return {
          type: 'recalculate',
          reason: 'Less restrictive requirements may enable new mastery achievements',
          affectedUsers: inProgressUsers,
          recommendations: [
            `${inProgressUsers} users in progress may now qualify for mastery`,
            'Recalculate mastery status based on new criteria',
            'Award appropriate XP for newly achieved mastery'
          ]
        };
      }

      if (challengesRequiredChanged && inProgressUsers > 0) {
        // Challenge count changed - need to update requirements
        return {
          type: 'recalculate',
          reason: 'Challenge requirements changed for users in progress',
          affectedUsers: inProgressUsers,
          recommendations: [
            `Update challenges_required field for ${inProgressUsers} users`,
            'Recalculate mastery status based on new requirements',
            'Preserve existing progress where possible'
          ]
        };
      }

      // Default to preserve if no major impact
      return {
        type: 'preserve',
        reason: 'Configuration changes have minimal impact on existing users',
        affectedUsers,
        recommendations: [
          'No immediate migration required',
          'Monitor for any unexpected behavior'
        ]
      };

    } catch (error) {
      throw new SkillProgressionError(
        `Failed to analyze migration impact: ${error}`,
        'MIGRATION_ANALYSIS_ERROR',
        skillId
      );
    }
  }

  /**
   * Execute migration based on strategy
   */
  async executeMigration(
    skillId: string,
    oldConfig: SkillConfiguration,
    newConfig: SkillConfiguration,
    strategy: MigrationStrategy
  ): Promise<MigrationExecutionResult> {
    const result: MigrationExecutionResult = {
      success: false,
      strategy,
      usersProcessed: 0,
      usersUpdated: 0,
      errors: [],
      warnings: []
    };

    try {
      switch (strategy.type) {
        case 'preserve':
          result.success = true;
          result.warnings.push('No migration performed - existing progress preserved');
          break;

        case 'recalculate':
          await this.executeRecalculationMigration(skillId, newConfig, result);
          break;

        case 'reset':
          await this.executeResetMigration(skillId, result);
          break;

        case 'manual_review':
          result.success = false;
          result.errors.push('Manual review required - migration not executed automatically');
          break;

        default:
          result.errors.push(`Unknown migration strategy: ${strategy.type}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Execute recalculation migration
   */
  private async executeRecalculationMigration(
    skillId: string,
    newConfig: SkillConfiguration,
    result: MigrationExecutionResult
  ): Promise<void> {
    // Get all users with progress on this skill
    const { data: progressData, error: fetchError } = await this.supabase
      .from('user_skill_progress')
      .select('*')
      .eq('skill_id', skillId)
      .eq('mastery_achieved', false); // Only process non-mastered users

    if (fetchError) {
      throw new SkillProgressionError(
        `Failed to fetch user progress: ${fetchError.message}`,
        'MIGRATION_FETCH_ERROR',
        skillId
      );
    }

    result.usersProcessed = progressData?.length || 0;

    if (!progressData || progressData.length === 0) {
      result.success = true;
      result.warnings.push('No users found with in-progress status');
      return;
    }

    // Process each user's progress
    for (const progress of progressData) {
      try {
        const updates: Partial<UserSkillProgress> = {};
        let shouldUpdate = false;

        // Update challenges_required if changed
        if (progress.challenges_required !== newConfig.masteryThreshold.challengesRequired) {
          updates.challengesRequired = newConfig.masteryThreshold.challengesRequired;
          shouldUpdate = true;
        }

        // Check if user now qualifies for mastery
        const meetsSuccessRate = progress.success_rate >= newConfig.masteryThreshold.minSuccessRate;
        const meetsChallengeCount = progress.challenges_completed >= newConfig.masteryThreshold.challengesRequired;

        if (meetsSuccessRate && meetsChallengeCount && !progress.mastery_achieved) {
          updates.masteryAchieved = true;
          updates.xpEarned = (progress.xp_earned || 0) + 50; // Mastery bonus
          shouldUpdate = true;
          result.warnings.push(`User ${progress.user_id} achieved mastery through migration`);
        }

        if (shouldUpdate) {
          const { error: updateError } = await this.supabase
            .from('user_skill_progress')
            .update({
              challenges_required: updates.challengesRequired,
              mastery_achieved: updates.masteryAchieved,
              xp_earned: updates.xpEarned,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', progress.user_id)
            .eq('skill_id', skillId);

          if (updateError) {
            result.errors.push(`Failed to update user ${progress.user_id}: ${updateError.message}`);
          } else {
            result.usersUpdated++;
          }
        }

      } catch (error) {
        result.errors.push(`Error processing user ${progress.user_id}: ${error}`);
      }
    }

    result.success = result.errors.length === 0;
  }

  /**
   * Execute reset migration (rarely used)
   */
  private async executeResetMigration(
    skillId: string,
    result: MigrationExecutionResult
  ): Promise<void> {
    // This is a destructive operation - use with extreme caution
    const { data: progressData, error: fetchError } = await this.supabase
      .from('user_skill_progress')
      .select('user_id')
      .eq('skill_id', skillId);

    if (fetchError) {
      throw new SkillProgressionError(
        `Failed to fetch user progress for reset: ${fetchError.message}`,
        'MIGRATION_RESET_ERROR',
        skillId
      );
    }

    result.usersProcessed = progressData?.length || 0;

    if (!progressData || progressData.length === 0) {
      result.success = true;
      result.warnings.push('No users found to reset');
      return;
    }

    // Reset all progress for this skill
    const { error: resetError } = await this.supabase
      .from('user_skill_progress')
      .update({
        challenges_completed: 0,
        success_rate: 0,
        mastery_achieved: false,
        total_attempts: 0,
        xp_earned: 0,
        updated_at: new Date().toISOString()
      })
      .eq('skill_id', skillId);

    if (resetError) {
      throw new SkillProgressionError(
        `Failed to reset user progress: ${resetError.message}`,
        'MIGRATION_RESET_ERROR',
        skillId
      );
    }

    result.usersUpdated = result.usersProcessed;
    result.success = true;
    result.warnings.push(`Reset progress for ${result.usersUpdated} users`);
  }

  /**
   * Validate migration safety before execution
   */
  async validateMigrationSafety(
    skillId: string,
    strategy: MigrationStrategy
  ): Promise<{ safe: boolean; warnings: string[]; blockers: string[] }> {
    const warnings: string[] = [];
    const blockers: string[] = [];

    try {
      // Check if skill has any users
      const { data: progressData, error } = await this.supabase
        .from('user_skill_progress')
        .select('id, mastery_achieved')
        .eq('skill_id', skillId)
        .limit(1);

      if (error) {
        blockers.push(`Failed to validate migration safety: ${error.message}`);
        return { safe: false, warnings, blockers };
      }

      // Warn about destructive operations
      if (strategy.type === 'reset') {
        warnings.push('Reset migration will permanently delete user progress');
        warnings.push('This operation cannot be undone');
      }

      if (strategy.type === 'manual_review') {
        blockers.push('Manual review required - automatic migration blocked');
      }

      // Check for high-impact migrations
      if (strategy.affectedUsers && strategy.affectedUsers > 100) {
        warnings.push(`High impact migration affecting ${strategy.affectedUsers} users`);
        warnings.push('Consider running during low-traffic periods');
      }

      const safe = blockers.length === 0;
      return { safe, warnings, blockers };

    } catch (error) {
      blockers.push(`Migration validation failed: ${error}`);
      return { safe: false, warnings, blockers };
    }
  }

  /**
   * Create migration rollback point
   */
  async createRollbackPoint(skillId: string): Promise<{ success: boolean; rollbackId?: string; error?: string }> {
    try {
      // In a production system, you'd create a backup of the current state
      // For now, we'll just return a mock rollback ID
      const rollbackId = `rollback_${skillId}_${Date.now()}`;
      
      // TODO: Implement actual backup creation
      // This would involve copying current progress data to a backup table
      
      return { success: true, rollbackId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Execute rollback to previous state
   */
  async executeRollback(rollbackId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement actual rollback logic
      // This would involve restoring data from the backup table
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

// Export singleton instance
export const skillConfigurationMigration = new SkillConfigurationMigration();