// ============================================
// Skill Progression Integration
// Connects ChallengeGenerator with SkillProgressionManager
// ============================================

import { challengeGenerator } from './challenge-generator';
import { skillProgressionManager } from './skill-progression-manager';
import { progressTracker } from './progress-tracker';
import type {
  GeneratedChallenge,
  ChallengeGenerationRequest,
  DifficultyLevel,
  SkillState,
  ChallengeAttempt,
  ChallengeResult
} from '@/types/skill-progression';
import type { SkillGraph } from './skill-progression-manager';

/**
 * Integrated service that combines challenge generation with skill progression
 */
export class SkillProgressionIntegration {
  /**
   * Get challenges for a skill based on user's current state and progress
   */
  async getChallengesForSkill(
    userId: string,
    skillId: string,
    skillGraph: SkillGraph
  ): Promise<{ challenges: GeneratedChallenge[]; canAccess: boolean; reason?: string }> {
    try {
      // Check if user can access this skill
      const skillState = await skillProgressionManager.getSkillState(userId, skillId, skillGraph);

      if (skillState === 'locked') {
        const unlockStatus = await skillProgressionManager.getSkillUnlockStatus(userId, skillId, skillGraph);
        return {
          challenges: [],
          canAccess: false,
          reason: `Complete these skills first: ${unlockStatus.unmetPrerequisites.join(', ')}`
        };
      }

      if (skillState === 'mastered') {
        // Still allow access for review/practice
        const challenges = await challengeGenerator.getChallengePool(skillId);
        return {
          challenges,
          canAccess: true,
          reason: 'Skill already mastered - practice mode'
        };
      }

      // Skill is unlocked - ensure we have challenges available
      await challengeGenerator.ensurePoolSize(skillId, undefined, 5);
      const challenges = await challengeGenerator.getChallengePool(skillId);

      return {
        challenges,
        canAccess: true
      };
    } catch (error) {
      console.error(`Failed to get challenges for skill ${skillId}:`, error);
      return {
        challenges: [],
        canAccess: false,
        reason: 'Error loading challenges'
      };
    }
  }

  /**
   * Generate adaptive challenge based on user's performance history
   */
  async generateAdaptiveChallenge(
    userId: string,
    skillId: string,
    userHistory: ChallengeAttempt[]
  ): Promise<GeneratedChallenge | null> {
    try {
      // Analyze user performance to determine appropriate difficulty
      const difficulty = this.calculateAdaptiveDifficulty(userHistory);

      const request: ChallengeGenerationRequest = {
        skillId,
        difficultyLevel: difficulty,
        userHistory
      };

      return await challengeGenerator.generateChallenge(request);
    } catch (error) {
      console.error(`Failed to generate adaptive challenge for user ${userId}, skill ${skillId}:`, error);
      return null;
    }
  }

  /**
   * Prepare challenges when a skill is unlocked
   */
  async onSkillUnlocked(skillId: string): Promise<void> {
    try {
      // Pre-generate challenges for newly unlocked skill
      await challengeGenerator.ensurePoolSize(skillId, undefined, 3);

      // Generate varied challenges for different difficulty levels
      await challengeGenerator.generateVariedChallenges(skillId, 2, 'Easy');
      await challengeGenerator.generateVariedChallenges(skillId, 2, 'Medium');

      console.log(`Prepared challenges for newly unlocked skill: ${skillId}`);
    } catch (error) {
      console.error(`Failed to prepare challenges for unlocked skill ${skillId}:`, error);
    }
  }

  /**
   * Record a challenge attempt and handle all progression logic
   */
  async recordChallengeAttempt(
    userId: string,
    skillId: string,
    challengeId: string,
    success: boolean,
    skillGraph: SkillGraph,
    options: {
      timeSpent?: number;
      hintsUsed?: number;
      submissionCode?: string;
      feedback?: string;
      difficultyLevel?: DifficultyLevel;
    } = {}
  ): Promise<{
    result: ChallengeResult;
    unlockedSkills: string[];
  }> {
    try {
      // Record the attempt using ProgressTracker
      const result = await progressTracker.recordChallengeAttempt(
        userId,
        skillId,
        challengeId,
        success,
        options
      );

      let unlockedSkills: string[] = [];

      // If mastery was achieved, handle skill unlocking
      if (result.masteryAchieved) {
        unlockedSkills = await this.onSkillMastered(userId, skillId, skillGraph);
      }

      return {
        result,
        unlockedSkills
      };
    } catch (error) {
      console.error(`Failed to record challenge attempt for user ${userId}, skill ${skillId}:`, error);
      throw error;
    }
  }

  /**
   * Simplified method for interactive course sessions to report progress
   * Doesn't require skill graph - useful for Genie chat sessions
   */
  async recordInteractiveChallengeAttempt(
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
      // Record the attempt directly to the progress tracker
      // This bypasses skill graph requirements for simpler integration
      const result = await progressTracker.recordChallengeAttempt(
        userId,
        skillId,
        challengeId,
        success,
        options
      );

      console.log(`[SKILL_PROGRESSION] Recorded interactive session attempt: userId=${userId}, skillId=${skillId}, success=${success}`);

      return result;
    } catch (error) {
      console.error(`Failed to record interactive challenge attempt for user ${userId}, skill ${skillId}:`, error);
      throw error;
    }
  }

  /**
   * Handle skill mastery achievement
   */
  async onSkillMastered(
    userId: string,
    skillId: string,
    skillGraph: SkillGraph
  ): Promise<string[]> {
    try {
      // Unlock dependent skills
      const unlockedSkills = await skillProgressionManager.unlockDependentSkills(
        userId,
        skillId,
        skillGraph
      );

      // Prepare challenges for newly unlocked skills
      for (const unlockedSkillId of unlockedSkills) {
        await this.onSkillUnlocked(unlockedSkillId);
      }

      return unlockedSkills;
    } catch (error) {
      console.error(`Failed to handle skill mastery for ${skillId}:`, error);
      return [];
    }
  }

  /**
   * Calculate adaptive difficulty based on user's performance history
   */
  private calculateAdaptiveDifficulty(history: ChallengeAttempt[]): DifficultyLevel {
    if (history.length === 0) {
      return 'Medium'; // Default for new users
    }

    // Analyze recent performance (last 5 attempts)
    const recentAttempts = history.slice(-5);
    const successRate = recentAttempts.filter(attempt => attempt.success).length / recentAttempts.length;
    const averageHints = recentAttempts.reduce((sum, attempt) => sum + attempt.hintsUsed, 0) / recentAttempts.length;

    // Adjust difficulty based on performance
    if (successRate >= 0.8 && averageHints <= 1) {
      return 'Hard'; // User is performing very well
    } else if (successRate >= 0.6 && averageHints <= 2) {
      return 'Medium'; // User is performing adequately
    } else {
      return 'Easy'; // User is struggling
    }
  }

  /**
   * Get progress display data for skills in the skill graph
   */
  async getSkillProgressData(
    userId: string,
    skillGraph: SkillGraph
  ): Promise<Array<{
    skillId: string;
    title: string;
    progressData: any; // ProgressDisplayData from progress-tracker
  }>> {
    try {
      const skillTitles = new Map<string, string>();
      skillGraph.nodes.forEach(node => {
        skillTitles.set(node.id, node.title);
      });

      const skillIds = skillGraph.nodes.map(node => node.id);
      const progressDataArray = await progressTracker.getMultipleProgressDisplayData(
        userId,
        skillIds,
        skillTitles,
        skillGraph
      );

      return progressDataArray.map(data => ({
        skillId: data.skillId,
        title: data.title,
        progressData: data
      }));
    } catch (error) {
      console.error(`Failed to get skill progress data for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get recommended next challenges for a user
   */
  async getRecommendedChallenges(
    userId: string,
    skillGraph: SkillGraph,
    limit: number = 5
  ): Promise<{ skillId: string; challenge: GeneratedChallenge }[]> {
    try {
      const recommendations: { skillId: string; challenge: GeneratedChallenge }[] = [];

      // Get all skill states for the user
      const skillStates = await skillProgressionManager.getAllSkillStates(userId, skillGraph);

      // Find unlocked skills that aren't mastered
      const availableSkills = Array.from(skillStates.entries())
        .filter(([_, state]) => state === 'unlocked')
        .map(([skillId, _]) => skillId);

      // Get challenges for available skills
      for (const skillId of availableSkills.slice(0, limit)) {
        try {
          await challengeGenerator.ensurePoolSize(skillId, undefined, 1);
          const challenges = await challengeGenerator.getChallengePool(skillId);

          if (challenges.length > 0) {
            recommendations.push({
              skillId,
              challenge: challenges[0] // Take the first available challenge
            });
          }
        } catch (error) {
          console.warn(`Failed to get challenge for skill ${skillId}:`, error);
        }
      }

      return recommendations;
    } catch (error) {
      console.error(`Failed to get recommended challenges for user ${userId}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const skillProgressionIntegration = new SkillProgressionIntegration();