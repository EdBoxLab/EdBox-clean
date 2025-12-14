/**
 * Evaluation Integration Service
 * 
 * Integrates the enhanced engine evaluation system with the skill progression system,
 * providing seamless evaluation handling and progress tracking.
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { engineEvaluationService, EvaluationRequest, EvaluationResult } from './engine-evaluation';
import { skillProgressionManager } from './skill-progression-manager';
import { progressTracker } from './progress-tracker';
import { DifficultyLevel } from '@/types/skill-progression';

/**
 * Challenge submission data
 */
export interface ChallengeSubmission {
  userId: string;
  skillId: string;
  challengeId: string;
  engine: string;
  submission: any;
  validationCriteria: any[];
  difficultyLevel: DifficultyLevel;
  timeSpent?: number;
  hintsUsed: number;
}

/**
 * Evaluation response with progress updates
 */
export interface EvaluationResponse extends EvaluationResult {
  progressUpdated: boolean;
  skillUnlocked?: string[];
  masteryAchieved?: boolean;
  xpAwarded: number;
}

/**
 * Evaluation Integration Service
 * 
 * Coordinates evaluation, progress tracking, and skill unlocking
 */
export class EvaluationIntegrationService {
  
  /**
   * Process a complete challenge submission with evaluation and progress tracking
   */
  async processSubmission(submission: ChallengeSubmission): Promise<EvaluationResponse> {
    try {
      // Create evaluation request
      const evaluationRequest: EvaluationRequest = {
        engine: submission.engine,
        challengeId: submission.challengeId,
        skillId: submission.skillId,
        submission: submission.submission,
        validationCriteria: submission.validationCriteria,
        difficultyLevel: submission.difficultyLevel,
        timeSpent: submission.timeSpent,
        hintsUsed: submission.hintsUsed
      };

      // Evaluate the submission
      const evaluationResult = await engineEvaluationService.evaluateSubmission(evaluationRequest);

      // Track progress and update user state
      const progressResult = await this.updateProgressAndUnlockSkills(
        submission.userId,
        submission.skillId,
        submission.challengeId,
        evaluationResult,
        submission.difficultyLevel
      );

      return {
        ...evaluationResult,
        progressUpdated: progressResult.progressUpdated,
        skillUnlocked: progressResult.skillsUnlocked,
        masteryAchieved: progressResult.masteryAchieved,
        xpAwarded: progressResult.xpAwarded
      };
    } catch (error) {
      console.error('Submission processing error:', error);
      throw new Error(`Failed to process submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate targeted hints for a specific challenge
   */
  async generateHints(
    engine: string,
    challengeDescription: string,
    submission: any,
    previousHints: string[] = [],
    difficultyLevel: DifficultyLevel,
    specificIssues?: string[]
  ): Promise<string[]> {
    return await engineEvaluationService.generateTargetedHints({
      engine,
      challengeDescription,
      submission,
      previousHints,
      difficultyLevel,
      specificIssues
    });
  }

  /**
   * Get evaluation feedback without updating progress (for practice mode)
   */
  async getEvaluationFeedback(submission: ChallengeSubmission): Promise<EvaluationResult> {
    const evaluationRequest: EvaluationRequest = {
      engine: submission.engine,
      challengeId: submission.challengeId,
      skillId: submission.skillId,
      submission: submission.submission,
      validationCriteria: submission.validationCriteria,
      difficultyLevel: submission.difficultyLevel,
      timeSpent: submission.timeSpent,
      hintsUsed: submission.hintsUsed
    };

    return await engineEvaluationService.evaluateSubmission(evaluationRequest);
  }

  /**
   * Update user progress and handle skill unlocking
   */
  private async updateProgressAndUnlockSkills(
    userId: string,
    skillId: string,
    challengeId: string,
    evaluationResult: EvaluationResult,
    difficultyLevel: DifficultyLevel
  ): Promise<{
    progressUpdated: boolean;
    skillsUnlocked: string[];
    masteryAchieved: boolean;
    xpAwarded: number;
  }> {
    try {
      // Record challenge attempt and get result
      const challengeResult = await progressTracker.recordChallengeAttempt(
        userId,
        skillId,
        challengeId,
        evaluationResult.success,
        {
          timeSpent: evaluationResult.timeSpent,
          hintsUsed: evaluationResult.hintsUsed,
          feedback: evaluationResult.feedback,
          difficultyLevel
        }
      );

      let skillsUnlocked: string[] = [];
      const masteryAchieved = challengeResult.masteryAchieved;
      const xpAwarded = challengeResult.xpAwarded;

      // If mastery was achieved, check for newly unlocked skills
      // Note: This would require skill graph context which isn't available here
      // In a real implementation, this would be handled by a higher-level service
      // that has access to the skill graph
      
      return {
        progressUpdated: true,
        skillsUnlocked,
        masteryAchieved,
        xpAwarded
      };
    } catch (error) {
      console.error('Progress update error:', error);
      return {
        progressUpdated: false,
        skillsUnlocked: [],
        masteryAchieved: false,
        xpAwarded: 0
      };
    }
  }



  /**
   * Get comprehensive evaluation metrics for a user's performance
   */
  async getPerformanceMetrics(userId: string, skillId?: string): Promise<{
    overallScore: number;
    accuracy: number;
    efficiency: number;
    completeness: number;
    methodology: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    totalAttempts: number;
    successRate: number;
  }> {
    try {
      if (skillId) {
        // Get metrics for a specific skill
        const summary = await progressTracker.getProgressSummary(userId, skillId);
        const displayData = await progressTracker.getProgressDisplayData(userId, skillId, 'Skill');
        
        return {
          overallScore: Math.round(summary.successRate * 100),
          accuracy: Math.round(summary.successRate * 100),
          efficiency: 75, // Placeholder - would need more detailed tracking
          completeness: Math.round(summary.progressPercentage),
          methodology: 70, // Placeholder - would need more detailed analysis
          recentTrend: displayData.recentPerformance.trend,
          totalAttempts: summary.totalAttempts,
          successRate: Math.round(summary.successRate * 100)
        };
      } else {
        // Get overall metrics across all skills
        const totalXP = await progressTracker.getTotalUserXP(userId);
        
        // For overall metrics, we'd need to aggregate across all skills
        // This is a simplified implementation
        return {
          overallScore: Math.min(100, Math.round(totalXP / 10)), // Rough estimate
          accuracy: 75, // Placeholder
          efficiency: 70, // Placeholder
          completeness: 60, // Placeholder
          methodology: 65, // Placeholder
          recentTrend: 'stable' as const,
          totalAttempts: 0, // Would need aggregation
          successRate: 75 // Placeholder
        };
      }
    } catch (error) {
      console.error('Performance metrics error:', error);
      throw new Error('Failed to calculate performance metrics');
    }
  }


}

// Export singleton instance
export const evaluationIntegrationService = new EvaluationIntegrationService();