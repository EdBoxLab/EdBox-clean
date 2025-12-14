// ============================================
// Progress Tracker Service
// Handles real-time progress updates, XP calculations, and progress persistence
// ============================================

import type {
  UserSkillProgress,
  ChallengeAttempt,
  ChallengeResult,
  ProgressSummary,
  DifficultyLevel,
  SkillConfiguration
} from '@/types/skill-progression';
import {
  ProgressTrackingError,
  SkillProgressionError
} from '@/types/skill-progression';
import { skillProgressionDb } from './skill-progression-db';
import { skillProgressionManager } from './skill-progression-manager';
import { skillProgressionCache } from './cache-service';

/**
 * XP calculation configuration
 */
interface XPConfig {
  baseXP: number;
  difficultyMultiplier: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  masteryBonus: number;
  streakBonus: number;
  perfectScoreBonus: number;
}

/**
 * Progress update event for real-time notifications
 */
export interface ProgressUpdateEvent {
  userId: string;
  skillId: string;
  type: 'challenge_completed' | 'mastery_achieved' | 'skill_unlocked' | 'xp_awarded';
  data: {
    xpAwarded?: number;
    masteryAchieved?: boolean;
    newlyUnlockedSkills?: string[];
    progressSummary?: ProgressSummary;
  };
  timestamp: Date;
}

/**
 * Progress display data for UI components
 */
export interface ProgressDisplayData {
  skillId: string;
  title: string;
  progressPercentage: number;
  challengesCompleted: number;
  challengesRequired: number;
  successRate: number;
  masteryAchieved: boolean;
  xpEarned: number;
  totalAttempts: number;
  lastAttempt?: Date;
  state: 'locked' | 'unlocked' | 'mastered';
  estimatedTimeToMastery?: number; // in minutes
  recentPerformance: {
    trend: 'improving' | 'stable' | 'declining';
    streakLength: number;
  };
}

/**
 * Service for tracking user progress and managing XP
 */
export class ProgressTracker {
  private db = skillProgressionDb;
  private progressionManager = skillProgressionManager;
  
  // XP calculation configuration
  private xpConfig: XPConfig = {
    baseXP: 10,
    difficultyMultiplier: {
      Easy: 1.0,
      Medium: 1.5,
      Hard: 2.0
    },
    masteryBonus: 50,
    streakBonus: 5,
    perfectScoreBonus: 10
  };

  // Event listeners for real-time updates
  private eventListeners: Array<(event: ProgressUpdateEvent) => void> = [];

  /**
   * Record a challenge attempt and update progress in real-time
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
  ): Promise<ChallengeResult> {
    try {
      // Record the attempt in the database
      const dbResult = await this.db.recordChallengeAttempt(
        userId,
        skillId,
        challengeId,
        success,
        options
      );

      // Calculate XP awarded for this attempt
      const xpAwarded = success ? this.calculateXP(
        options.difficultyLevel || 'Medium',
        options.hintsUsed || 0,
        options.timeSpent,
        await this.getRecentStreak(userId, skillId)
      ) : 0;

      // Check if mastery was achieved
      const masteryAchieved = dbResult.masteryAchieved;

      // Add mastery bonus XP if achieved
      const totalXP = masteryAchieved ? xpAwarded + this.xpConfig.masteryBonus : xpAwarded;

      // Create challenge result
      const challengeResult: ChallengeResult = {
        success,
        masteryAchieved,
        xpAwarded: totalXP,
        successRate: dbResult.successRate,
        challengesCompleted: dbResult.challengesCompleted,
        challengesRequired: dbResult.challengesRequired,
        feedback: options.feedback
      };

      // Invalidate cache since progress has changed
      this.invalidateProgressCache(userId, skillId);

      // Emit progress update event
      await this.emitProgressUpdate(userId, skillId, 'challenge_completed', {
        xpAwarded: totalXP,
        masteryAchieved,
        progressSummary: await this.getProgressSummary(userId, skillId)
      });

      // If mastery was achieved, emit mastery event and check for unlocked skills
      if (masteryAchieved) {
        await this.emitProgressUpdate(userId, skillId, 'mastery_achieved', {
          masteryAchieved: true,
          xpAwarded: this.xpConfig.masteryBonus
        });

        // Note: Skill unlocking would require skill graph context
        // This would typically be handled by a higher-level service
      }

      return challengeResult;
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new ProgressTrackingError(
        `Failed to record challenge attempt: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Get comprehensive progress summary for a skill
   */
  async getProgressSummary(userId: string, skillId: string): Promise<ProgressSummary> {
    try {
      return await this.progressionManager.calculateMasteryProgress(userId, skillId);
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get progress summary: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Get progress display data formatted for UI components
   */
  async getProgressDisplayData(
    userId: string, 
    skillId: string, 
    skillTitle: string,
    skillGraph?: any
  ): Promise<ProgressDisplayData> {
    try {
      // Check cache first
      const cacheKey = `display:${userId}:${skillId}`;
      const cached = skillProgressionCache.getProgress(userId, skillId);
      if (cached) {
        // Return cached display data if available and recent
        const displayData = this.convertProgressToDisplayData(cached, skillTitle, skillGraph);
        if (displayData) {
          return displayData;
        }
      }

      // Get basic progress summary
      const summary = await this.getProgressSummary(userId, skillId);
      
      // Get skill state if skill graph is provided
      let state: 'locked' | 'unlocked' | 'mastered' = 'unlocked';
      if (skillGraph) {
        state = await this.progressionManager.getSkillState(userId, skillId, skillGraph);
      } else if (summary.masteryAchieved) {
        state = 'mastered';
      }

      // Get recent performance data
      const recentPerformance = await this.analyzeRecentPerformance(userId, skillId);
      
      // Estimate time to mastery based on current progress and performance
      const estimatedTimeToMastery = this.estimateTimeToMastery(summary, recentPerformance);

      const displayData = {
        skillId,
        title: skillTitle,
        progressPercentage: summary.progressPercentage,
        challengesCompleted: summary.challengesCompleted,
        challengesRequired: summary.challengesRequired,
        successRate: summary.successRate,
        masteryAchieved: summary.masteryAchieved,
        xpEarned: summary.xpEarned,
        totalAttempts: summary.totalAttempts,
        lastAttempt: summary.lastAttempt,
        state,
        estimatedTimeToMastery,
        recentPerformance
      };

      // Cache the progress data for faster subsequent access
      // Note: We'll cache the display data instead since summary doesn't have all required fields
      // This would require converting summary to UserSkillProgress format or using a different cache key

      return displayData;
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get progress display data: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Get progress display data for multiple skills
   */
  async getMultipleProgressDisplayData(
    userId: string,
    skillIds: string[],
    skillTitles: Map<string, string>,
    skillGraph?: any
  ): Promise<ProgressDisplayData[]> {
    try {
      const progressData: ProgressDisplayData[] = [];

      // Process skills in parallel for better performance
      const promises = skillIds.map(async (skillId) => {
        const title = skillTitles.get(skillId) || skillId;
        return await this.getProgressDisplayData(userId, skillId, title, skillGraph);
      });

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get multiple progress display data: ${error}`,
        'multiple',
        userId
      );
    }
  }

  /**
   * Calculate XP awarded for a challenge attempt
   */
  private calculateXP(
    difficulty: DifficultyLevel,
    hintsUsed: number,
    timeSpent?: number,
    streakLength: number = 0
  ): number {
    // Base XP with difficulty multiplier
    let xp = this.xpConfig.baseXP * this.xpConfig.difficultyMultiplier[difficulty];

    // Reduce XP for hints used (max 50% reduction)
    const hintPenalty = Math.min(0.5, hintsUsed * 0.1);
    xp *= (1 - hintPenalty);

    // Add streak bonus
    if (streakLength > 0) {
      xp += Math.min(this.xpConfig.streakBonus * streakLength, 50); // Cap at 50 bonus XP
    }

    // Perfect score bonus (no hints, reasonable time)
    if (hintsUsed === 0 && timeSpent && timeSpent < 300) { // Less than 5 minutes
      xp += this.xpConfig.perfectScoreBonus;
    }

    return Math.round(xp);
  }

  /**
   * Get recent success streak for a user and skill
   */
  private async getRecentStreak(userId: string, skillId: string): Promise<number> {
    try {
      const attempts = await this.db.getChallengeAttempts(userId, skillId, 10);
      
      let streak = 0;
      for (const attempt of attempts) {
        if (attempt.success) {
          streak++;
        } else {
          break; // Streak broken
        }
      }

      return streak;
    } catch (error) {
      // Return 0 if we can't get streak data
      return 0;
    }
  }

  /**
   * Analyze recent performance trends
   */
  private async analyzeRecentPerformance(userId: string, skillId: string): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    streakLength: number;
  }> {
    try {
      const attempts = await this.db.getChallengeAttempts(userId, skillId, 20);
      
      if (attempts.length < 3) {
        return { trend: 'stable', streakLength: 0 };
      }

      // Calculate success rate for recent vs older attempts
      const recentAttempts = attempts.slice(0, Math.min(10, attempts.length));
      const olderAttempts = attempts.slice(10);

      const recentSuccessRate = recentAttempts.filter(a => a.success).length / recentAttempts.length;
      const olderSuccessRate = olderAttempts.length > 0 
        ? olderAttempts.filter(a => a.success).length / olderAttempts.length 
        : recentSuccessRate;

      // Determine trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      const difference = recentSuccessRate - olderSuccessRate;
      
      if (difference > 0.1) {
        trend = 'improving';
      } else if (difference < -0.1) {
        trend = 'declining';
      }

      // Calculate current streak
      const streakLength = await this.getRecentStreak(userId, skillId);

      return { trend, streakLength };
    } catch (error) {
      return { trend: 'stable', streakLength: 0 };
    }
  }

  /**
   * Estimate time to mastery based on current progress and performance
   */
  private estimateTimeToMastery(
    summary: ProgressSummary,
    performance: { trend: string; streakLength: number }
  ): number | undefined {
    if (summary.masteryAchieved) {
      return 0;
    }

    const remainingChallenges = summary.challengesRequired - summary.challengesCompleted;
    
    if (remainingChallenges <= 0 || summary.totalAttempts === 0) {
      return undefined;
    }

    // Base estimate: assume 10 minutes per challenge
    let estimatedMinutes = remainingChallenges * 10;

    // Adjust based on success rate
    if (summary.successRate > 0) {
      // If success rate is low, user might need more attempts
      const attemptsPerSuccess = 1 / summary.successRate;
      estimatedMinutes *= attemptsPerSuccess;
    }

    // Adjust based on performance trend
    if (performance.trend === 'improving') {
      estimatedMinutes *= 0.8; // 20% faster
    } else if (performance.trend === 'declining') {
      estimatedMinutes *= 1.3; // 30% slower
    }

    return Math.round(estimatedMinutes);
  }

  /**
   * Emit progress update event to listeners
   */
  private async emitProgressUpdate(
    userId: string,
    skillId: string,
    type: ProgressUpdateEvent['type'],
    data: ProgressUpdateEvent['data']
  ): Promise<void> {
    const event: ProgressUpdateEvent = {
      userId,
      skillId,
      type,
      data,
      timestamp: new Date()
    };

    // Notify all listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in progress update listener:', error);
      }
    });
  }

  /**
   * Subscribe to progress update events
   */
  onProgressUpdate(listener: (event: ProgressUpdateEvent) => void): () => void {
    this.eventListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get total XP earned by a user across all skills
   */
  async getTotalUserXP(userId: string): Promise<number> {
    try {
      const allProgress = await this.db.getUserProgressAll(userId);
      return allProgress.reduce((total, progress) => total + progress.xpEarned, 0);
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get total user XP: ${error}`,
        'all',
        userId
      );
    }
  }

  /**
   * Get user's XP leaderboard position (if needed for gamification)
   */
  async getUserXPRank(userId: string): Promise<{ rank: number; totalUsers: number; xp: number }> {
    try {
      // This would require a more complex query or caching mechanism
      // For now, return basic data
      const userXP = await this.getTotalUserXP(userId);
      
      return {
        rank: 1, // Placeholder - would need proper ranking query
        totalUsers: 1, // Placeholder - would need user count
        xp: userXP
      };
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get user XP rank: ${error}`,
        'all',
        userId
      );
    }
  }

  /**
   * Reset progress for a skill (admin function)
   */
  async resetSkillProgress(userId: string, skillId: string): Promise<void> {
    try {
      // This would require a database function to reset progress
      // For now, throw an error indicating it's not implemented
      throw new SkillProgressionError(
        'Reset skill progress not yet implemented',
        'NOT_IMPLEMENTED',
        skillId,
        userId
      );
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to reset skill progress: ${error}`,
        skillId,
        userId
      );
    }
  }

  /**
   * Update XP configuration (admin function)
   */
  updateXPConfig(newConfig: Partial<XPConfig>): void {
    this.xpConfig = { ...this.xpConfig, ...newConfig };
  }

  /**
   * Get current XP configuration
   */
  getXPConfig(): XPConfig {
    return { ...this.xpConfig };
  }

  /**
   * Convert cached progress data to display data format
   */
  private convertProgressToDisplayData(
    progress: UserSkillProgress, 
    skillTitle: string, 
    skillGraph?: any
  ): ProgressDisplayData | null {
    try {
      // Check if cached data is recent enough (within 2 minutes)
      const cacheAge = Date.now() - new Date(progress.updatedAt).getTime();
      if (cacheAge > 2 * 60 * 1000) {
        return null; // Cache too old
      }

      // Determine skill state
      let state: 'locked' | 'unlocked' | 'mastered' = 'unlocked';
      if (progress.masteryAchieved) {
        state = 'mastered';
      }

      return {
        skillId: progress.skillId,
        title: skillTitle,
        progressPercentage: (progress.challengesCompleted / progress.challengesRequired) * 100,
        challengesCompleted: progress.challengesCompleted,
        challengesRequired: progress.challengesRequired,
        successRate: progress.successRate,
        masteryAchieved: progress.masteryAchieved,
        xpEarned: progress.xpEarned,
        totalAttempts: progress.totalAttempts,
        lastAttempt: progress.lastAttempt,
        state,
        estimatedTimeToMastery: 0, // Would need to recalculate
        recentPerformance: {
          trend: 'stable' as const,
          streakLength: 0
        }
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Invalidate cache when progress is updated
   */
  private invalidateProgressCache(userId: string, skillId: string): void {
    skillProgressionCache.invalidateProgress(userId, skillId);
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker();