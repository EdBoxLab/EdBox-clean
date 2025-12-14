// ============================================
// Adaptive Difficulty Service
// Handles performance analysis and difficulty adjustment based on user history
// ============================================

import type {
  DifficultyLevel,
  ChallengeAttempt,
  DifficultyAdjustment,
  PerformanceMetrics,
  UserSkillProgress
} from '@/types/skill-progression';
import { skillProgressionDb } from './skill-progression-db';

/**
 * Performance analysis configuration
 */
interface AnalysisConfig {
  recentAttemptsWindow: number;
  successRateThresholds: {
    struggling: number;
    comfortable: number;
    excelling: number;
  };
  timeThresholds: {
    fast: number; // seconds
    slow: number; // seconds
  };
  hintsThresholds: {
    low: number;
    high: number;
  };
  streakThresholds: {
    success: number;
    failure: number;
  };
}

/**
 * Cross-skill performance data
 */
interface CrossSkillPerformance {
  skillId: string;
  successRate: number;
  averageTime: number;
  difficultyLevel: DifficultyLevel;
  recentAttempts: number;
}

/**
 * Service for adaptive difficulty management
 */
export class AdaptiveDifficultyService {
  private db = skillProgressionDb;
  
  private config: AnalysisConfig = {
    recentAttemptsWindow: 10,
    successRateThresholds: {
      struggling: 0.4,
      comfortable: 0.7,
      excelling: 0.9
    },
    timeThresholds: {
      fast: 300, // 5 minutes
      slow: 1800 // 30 minutes
    },
    hintsThresholds: {
      low: 1,
      high: 4
    },
    streakThresholds: {
      success: 3,
      failure: 2
    }
  };

  /**
   * Analyze user performance and suggest difficulty adjustment
   */
  async analyzeDifficultyAdjustment(
    userId: string,
    skillId: string,
    currentDifficulty: DifficultyLevel
  ): Promise<DifficultyAdjustment> {
    try {
      // Get performance metrics for this skill
      const metrics = await this.calculatePerformanceMetrics(userId, skillId);
      
      // Get cross-skill performance for context
      const crossSkillData = await this.getCrossSkillPerformance(userId);
      
      // Determine suggested difficulty based on analysis
      const suggestedDifficulty = this.determineSuggestedDifficulty(
        currentDifficulty,
        metrics,
        crossSkillData
      );
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(metrics);
      
      // Generate reason for adjustment
      const reason = this.generateAdjustmentReason(
        currentDifficulty,
        suggestedDifficulty,
        metrics
      );

      return {
        currentDifficulty,
        suggestedDifficulty,
        reason,
        confidenceScore
      };
    } catch (error) {
      // Default to moderate difficulty with low confidence on error
      return {
        currentDifficulty,
        suggestedDifficulty: 'Medium',
        reason: 'Insufficient data for analysis, using moderate difficulty',
        confidenceScore: 0.1
      };
    }
  }

  /**
   * Calculate performance metrics for a user on a specific skill
   */
  async calculatePerformanceMetrics(userId: string, skillId: string): Promise<PerformanceMetrics> {
    // Get recent challenge attempts
    const recentAttempts = await this.db.getRecentChallengeAttempts(
      userId,
      skillId,
      this.config.recentAttemptsWindow
    );

    if (recentAttempts.length === 0) {
      return {
        recentSuccessRate: 0.5, // Default moderate success rate
        averageTimeSpent: 600, // Default 10 minutes
        hintsUsageRate: 0.5, // Default moderate hints usage
        streakLength: 0,
        strugglingIndicators: ['No attempt history available']
      };
    }

    // Calculate success rate
    const successfulAttempts = recentAttempts.filter(attempt => attempt.success);
    const recentSuccessRate = successfulAttempts.length / recentAttempts.length;

    // Calculate average time spent (only for attempts with time data)
    const attemptsWithTime = recentAttempts.filter(attempt => attempt.timeSpent !== undefined);
    const averageTimeSpent = attemptsWithTime.length > 0
      ? attemptsWithTime.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / attemptsWithTime.length
      : 600; // Default 10 minutes

    // Calculate hints usage rate
    const averageHintsUsed = recentAttempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0) / recentAttempts.length;
    const hintsUsageRate = Math.min(1, averageHintsUsed / 5); // Normalize to 0-1 scale

    // Calculate current streak
    const streakLength = this.calculateCurrentStreak(recentAttempts);

    // Identify struggling indicators
    const strugglingIndicators = this.identifyStrugglingIndicators(
      recentSuccessRate,
      averageTimeSpent,
      hintsUsageRate,
      recentAttempts
    );

    return {
      recentSuccessRate,
      averageTimeSpent,
      hintsUsageRate,
      streakLength,
      strugglingIndicators
    };
  }

  /**
   * Get cross-skill performance data for context
   */
  async getCrossSkillPerformance(userId: string): Promise<CrossSkillPerformance[]> {
    try {
      // Get user's progress across all skills
      const allProgress = await this.db.getAllUserProgress(userId);
      
      const crossSkillData: CrossSkillPerformance[] = [];
      
      for (const progress of allProgress) {
        if (progress.totalAttempts > 0) {
          // Get recent attempts for this skill to determine average time
          const recentAttempts = await this.db.getRecentChallengeAttempts(
            userId,
            progress.skillId,
            5 // Smaller window for cross-skill analysis
          );
          
          const attemptsWithTime = recentAttempts.filter(attempt => attempt.timeSpent !== undefined);
          const averageTime = attemptsWithTime.length > 0
            ? attemptsWithTime.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / attemptsWithTime.length
            : 600;

          // Determine difficulty level from recent attempts
          const difficultyLevel = recentAttempts.length > 0
            ? recentAttempts[0].difficultyLevel
            : 'Medium';

          crossSkillData.push({
            skillId: progress.skillId,
            successRate: progress.successRate,
            averageTime,
            difficultyLevel,
            recentAttempts: recentAttempts.length
          });
        }
      }
      
      return crossSkillData;
    } catch (error) {
      console.warn('Failed to get cross-skill performance data:', error);
      return [];
    }
  }

  /**
   * Determine suggested difficulty based on performance analysis
   */
  private determineSuggestedDifficulty(
    currentDifficulty: DifficultyLevel,
    metrics: PerformanceMetrics,
    crossSkillData: CrossSkillPerformance[]
  ): DifficultyLevel {
    const { recentSuccessRate, averageTimeSpent, hintsUsageRate, streakLength } = metrics;
    
    // Calculate performance score (0-1 scale)
    let performanceScore = 0;
    
    // Success rate component (40% weight)
    performanceScore += recentSuccessRate * 0.4;
    
    // Time efficiency component (20% weight)
    const timeEfficiency = Math.max(0, Math.min(1, 1 - (averageTimeSpent - this.config.timeThresholds.fast) / 
      (this.config.timeThresholds.slow - this.config.timeThresholds.fast)));
    performanceScore += timeEfficiency * 0.2;
    
    // Hints efficiency component (20% weight)
    const hintsEfficiency = Math.max(0, 1 - hintsUsageRate);
    performanceScore += hintsEfficiency * 0.2;
    
    // Streak bonus/penalty (20% weight)
    const streakBonus = streakLength > 0 
      ? Math.min(0.2, streakLength * 0.05)
      : Math.max(-0.2, streakLength * 0.1); // Negative streak is failure streak
    performanceScore += streakBonus;
    
    // Consider cross-skill performance for new users
    if (crossSkillData.length > 0) {
      const avgCrossSkillSuccess = crossSkillData.reduce((sum, data) => sum + data.successRate, 0) / crossSkillData.length;
      
      // If user is new to this skill but has good performance elsewhere, start higher
      if (metrics.strugglingIndicators.includes('No attempt history available') && avgCrossSkillSuccess > 0.7) {
        return 'Medium';
      }
    }

    // Determine difficulty based on performance score
    if (performanceScore >= this.config.successRateThresholds.excelling) {
      // User is excelling, increase difficulty
      return this.increaseDifficulty(currentDifficulty);
    } else if (performanceScore <= this.config.successRateThresholds.struggling) {
      // User is struggling, decrease difficulty
      return this.decreaseDifficulty(currentDifficulty);
    } else if (performanceScore >= this.config.successRateThresholds.comfortable) {
      // User is comfortable, slight increase or maintain
      if (streakLength >= this.config.streakThresholds.success) {
        return this.increaseDifficulty(currentDifficulty);
      }
    }
    
    // Default: maintain current difficulty
    return currentDifficulty;
  }

  /**
   * Calculate confidence score for the difficulty adjustment
   */
  private calculateConfidenceScore(metrics: PerformanceMetrics): number {
    let confidence = 0.5; // Base confidence
    
    // More data = higher confidence
    if (!metrics.strugglingIndicators.includes('No attempt history available')) {
      confidence += 0.3;
    }
    
    // Clear performance patterns = higher confidence
    if (metrics.recentSuccessRate <= 0.3 || metrics.recentSuccessRate >= 0.8) {
      confidence += 0.2;
    }
    
    // Consistent performance indicators = higher confidence
    if (metrics.hintsUsageRate < 0.2 || metrics.hintsUsageRate > 0.8) {
      confidence += 0.1;
    }
    
    // Strong streak = higher confidence
    if (Math.abs(metrics.streakLength) >= 3) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * Generate human-readable reason for difficulty adjustment
   */
  private generateAdjustmentReason(
    currentDifficulty: DifficultyLevel,
    suggestedDifficulty: DifficultyLevel,
    metrics: PerformanceMetrics
  ): string {
    if (currentDifficulty === suggestedDifficulty) {
      return `Maintaining ${currentDifficulty} difficulty - performance is appropriate for current level`;
    }

    const reasons: string[] = [];
    
    if (metrics.recentSuccessRate >= this.config.successRateThresholds.excelling) {
      reasons.push(`high success rate (${(metrics.recentSuccessRate * 100).toFixed(0)}%)`);
    } else if (metrics.recentSuccessRate <= this.config.successRateThresholds.struggling) {
      reasons.push(`low success rate (${(metrics.recentSuccessRate * 100).toFixed(0)}%)`);
    }
    
    if (metrics.averageTimeSpent < this.config.timeThresholds.fast) {
      reasons.push('completing challenges quickly');
    } else if (metrics.averageTimeSpent > this.config.timeThresholds.slow) {
      reasons.push('taking longer than expected');
    }
    
    if (metrics.hintsUsageRate < 0.2) {
      reasons.push('minimal hints usage');
    } else if (metrics.hintsUsageRate > 0.8) {
      reasons.push('frequent hints usage');
    }
    
    if (metrics.streakLength >= this.config.streakThresholds.success) {
      reasons.push(`${metrics.streakLength} consecutive successes`);
    } else if (metrics.streakLength <= -this.config.streakThresholds.failure) {
      reasons.push(`${Math.abs(metrics.streakLength)} consecutive failures`);
    }

    const direction = this.getDifficultyDirection(currentDifficulty, suggestedDifficulty);
    const reasonText = reasons.length > 0 ? reasons.join(', ') : 'performance analysis';
    
    return `${direction} difficulty based on ${reasonText}`;
  }

  /**
   * Calculate current streak (positive for success, negative for failure)
   */
  private calculateCurrentStreak(attempts: ChallengeAttempt[]): number {
    if (attempts.length === 0) return 0;
    
    // Sort by timestamp (most recent first)
    const sortedAttempts = [...attempts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    let streak = 0;
    const firstResult = sortedAttempts[0].success;
    
    for (const attempt of sortedAttempts) {
      if (attempt.success === firstResult) {
        streak += firstResult ? 1 : -1;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Identify indicators that the user is struggling
   */
  private identifyStrugglingIndicators(
    successRate: number,
    averageTime: number,
    hintsUsage: number,
    attempts: ChallengeAttempt[]
  ): string[] {
    const indicators: string[] = [];
    
    if (attempts.length === 0) {
      indicators.push('No attempt history available');
      return indicators;
    }
    
    if (successRate < this.config.successRateThresholds.struggling) {
      indicators.push('Low success rate');
    }
    
    if (averageTime > this.config.timeThresholds.slow) {
      indicators.push('Taking longer than expected');
    }
    
    if (hintsUsage > 0.8) {
      indicators.push('Heavy reliance on hints');
    }
    
    // Check for declining performance
    if (attempts.length >= 5) {
      const recentHalf = attempts.slice(0, Math.floor(attempts.length / 2));
      const olderHalf = attempts.slice(Math.floor(attempts.length / 2));
      
      const recentSuccess = recentHalf.filter(a => a.success).length / recentHalf.length;
      const olderSuccess = olderHalf.filter(a => a.success).length / olderHalf.length;
      
      if (recentSuccess < olderSuccess - 0.2) {
        indicators.push('Declining performance trend');
      }
    }
    
    return indicators;
  }

  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'Easy': return 'Medium';
      case 'Medium': return 'Hard';
      case 'Hard': return 'Hard'; // Already at max
      default: return 'Medium';
    }
  }

  /**
   * Decrease difficulty level
   */
  private decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    switch (current) {
      case 'Hard': return 'Medium';
      case 'Medium': return 'Easy';
      case 'Easy': return 'Easy'; // Already at min
      default: return 'Medium';
    }
  }

  /**
   * Get direction description for difficulty change
   */
  private getDifficultyDirection(current: DifficultyLevel, suggested: DifficultyLevel): string {
    const levels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const currentLevel = levels[current];
    const suggestedLevel = levels[suggested];
    
    if (suggestedLevel > currentLevel) {
      return 'Increasing';
    } else if (suggestedLevel < currentLevel) {
      return 'Decreasing';
    } else {
      return 'Maintaining';
    }
  }

  /**
   * Get default difficulty for new users based on cross-skill performance
   */
  async getDefaultDifficultyForNewUser(userId: string): Promise<DifficultyLevel> {
    try {
      const crossSkillData = await this.getCrossSkillPerformance(userId);
      
      if (crossSkillData.length === 0) {
        return 'Medium'; // Default for completely new users
      }
      
      const avgSuccessRate = crossSkillData.reduce((sum, data) => sum + data.successRate, 0) / crossSkillData.length;
      
      if (avgSuccessRate >= 0.8) {
        return 'Medium'; // Start at medium for high performers
      } else if (avgSuccessRate <= 0.4) {
        return 'Easy'; // Start at easy for struggling users
      } else {
        return 'Medium'; // Default moderate difficulty
      }
    } catch (error) {
      console.warn('Failed to determine default difficulty:', error);
      return 'Medium';
    }
  }
}

// Export singleton instance
export const adaptiveDifficultyService = new AdaptiveDifficultyService();