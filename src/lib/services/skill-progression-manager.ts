// ============================================
// Skill Progression Manager Service
// Handles skill unlocking logic, mastery calculations, and state management
// ============================================

import type {
  SkillState,
  SkillUnlockStatus,
  SkillConfiguration,
  UserSkillProgress,
  ChallengeResult,
  ProgressSummary,
  DifficultyLevel
} from '@/types/skill-progression';
import {
  SkillProgressionError,
  ProgressTrackingError
} from '@/types/skill-progression';
import { skillProgressionDb } from './skill-progression-db';
import { skillProgressionCache } from './cache-service';

/**
 * Skill graph node representing a skill and its dependencies
 */
export interface SkillNode {
  id: string;
  title: string;
  description: string;
  prerequisites: string[];
  engine: string;
  difficulty: DifficultyLevel;
}

/**
 * Skill graph representing the complete learning path
 */
export interface SkillGraph {
  nodes: SkillNode[];
  edges: Array<{ from: string; to: string }>;
}

/**
 * Service for managing skill progression logic
 */
export class SkillProgressionManager {
  private db = skillProgressionDb;

  /**
   * Get the current state of a skill for a user
   */
  async getSkillState(userId: string, skillId: string, skillGraph: SkillGraph): Promise<SkillState> {
    try {
      // Get user's progress for this skill
      const progress = await this.db.getSkillProgress(userId, skillId);

      // If user has mastered the skill, return mastered
      if (progress.masteryAchieved) {
        return 'mastered';
      }

      // Check if skill can be unlocked based on prerequisites
      const unlockStatus = await this.getSkillUnlockStatus(userId, skillId, skillGraph);

      return unlockStatus.canUnlock ? 'unlocked' : 'locked';
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Failed to get skill state: ${error}`,
        'SKILL_STATE_ERROR',
        skillId,
        userId
      );
    }
  }

  /**
   * Get unlock status for a skill including prerequisite information
   */
  async getSkillUnlockStatus(userId: string, skillId: string, skillGraph: SkillGraph): Promise<SkillUnlockStatus> {
    try {
      // Find the skill node in the graph
      const skillNode = skillGraph.nodes.find(node => node.id === skillId);
      if (!skillNode) {
        throw new SkillProgressionError(
          `Skill ${skillId} not found in skill graph`,
          'SKILL_NOT_FOUND',
          skillId,
          userId
        );
      }

      // Get completed skills (≥1 challenge done) for unlock logic
      const completedSkills = await this.db.getCompletedSkills(userId);
      const completedSkillsSet = new Set(completedSkills);

      // Get mastered skills for visual state
      const masteredSkills = await this.db.getMasteredSkills(userId);
      const masteredSkillsSet = new Set(masteredSkills);

      // Prerequisites are met once the user has completed them (≥1 challenge)
      const unmetPrerequisites = skillNode.prerequisites.filter(
        prereqId => !completedSkillsSet.has(prereqId)
      );

      // Determine if skill can be unlocked
      const canUnlock = unmetPrerequisites.length === 0;

      // Determine current state
      let state: SkillState = 'locked';
      if (canUnlock) {
        // Check if already mastered
        if (masteredSkillsSet.has(skillId)) {
          state = 'mastered';
        } else {
          state = 'unlocked';
        }
      }

      return {
        skillId,
        state,
        prerequisites: skillNode.prerequisites,
        unmetPrerequisites,
        canUnlock
      };
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Failed to get skill unlock status: ${error}`,
        'UNLOCK_STATUS_ERROR',
        skillId,
        userId
      );
    }
  }

  /**
   * Calculate mastery progress for a skill
   */
  async calculateMasteryProgress(userId: string, skillId: string): Promise<ProgressSummary> {
    try {
      // Get user's current progress
      const progress = await this.db.getSkillProgress(userId, skillId);

      // Calculate progress percentage
      const progressPercentage = progress.challengesRequired > 0
        ? Math.min(100, (progress.challengesCompleted / progress.challengesRequired) * 100)
        : 0;

      return {
        skillId,
        challengesCompleted: progress.challengesCompleted,
        challengesRequired: progress.challengesRequired,
        successRate: progress.successRate,
        masteryAchieved: progress.masteryAchieved,
        xpEarned: progress.xpEarned,
        totalAttempts: progress.totalAttempts,
        lastAttempt: progress.lastAttempt ? new Date(progress.lastAttempt) : undefined,
        progressPercentage
      };
    } catch (error) {
      if (error instanceof ProgressTrackingError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Failed to calculate mastery progress: ${error}`,
        'MASTERY_CALCULATION_ERROR',
        skillId,
        userId
      );
    }
  }

  /**
   * Check if a challenge attempt results in skill mastery
   */
  async checkMasteryAchievement(
    userId: string,
    skillId: string,
    challengeResult: ChallengeResult
  ): Promise<boolean> {
    try {
      // Get skill configuration
      const config = await this.db.getSkillConfiguration(skillId);
      if (!config) {
        throw new SkillProgressionError(
          `No configuration found for skill ${skillId}`,
          'SKILL_CONFIG_NOT_FOUND',
          skillId,
          userId
        );
      }

      // Check if mastery criteria are met
      const meetsSuccessRate = challengeResult.successRate >= config.masteryThreshold.minSuccessRate;
      const meetsMinChallenges = challengeResult.challengesCompleted >= config.masteryThreshold.challengesRequired;

      return meetsSuccessRate && meetsMinChallenges;
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Failed to check mastery achievement: ${error}`,
        'MASTERY_CHECK_ERROR',
        skillId,
        userId
      );
    }
  }

  /**
   * Unlock dependent skills when a skill is mastered
   */
  async unlockDependentSkills(userId: string, masteredSkillId: string, skillGraph: SkillGraph): Promise<string[]> {
    try {
      const unlockedSkills: string[] = [];

      // Find all skills that depend on the mastered skill
      const dependentSkills = skillGraph.nodes.filter(node =>
        node.prerequisites.includes(masteredSkillId)
      );

      // Check each dependent skill to see if it can now be unlocked
      for (const skill of dependentSkills) {
        const unlockStatus = await this.getSkillUnlockStatus(userId, skill.id, skillGraph);

        // If the skill can now be unlocked and wasn't already unlocked
        if (unlockStatus.canUnlock && unlockStatus.state !== 'mastered') {
          unlockedSkills.push(skill.id);
        }
      }

      return unlockedSkills;
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to unlock dependent skills: ${error}`,
        'DEPENDENT_UNLOCK_ERROR',
        masteredSkillId,
        userId
      );
    }
  }

  /**
   * Get all skill states for a user in a skill graph
   */
  async getAllSkillStates(userId: string, skillGraph: SkillGraph): Promise<Map<string, SkillState>> {
    try {
      // Check cache first
      const graphId = this.generateGraphId(skillGraph);
      const cachedStates = skillProgressionCache.getSkillStates(userId, graphId);
      if (cachedStates) {
        return cachedStates;
      }

      const skillStates = new Map<string, SkillState>();

      // Get completed skills (≥1 challenge) for unlock logic
      const completedSkills = await this.db.getCompletedSkills(userId);
      const completedSkillsSet = new Set(completedSkills);

      // Get mastered skills for visual state
      const masteredSkills = await this.db.getMasteredSkills(userId);
      const masteredSkillsSet = new Set(masteredSkills);

      // Process each skill in the graph
      for (const node of skillGraph.nodes) {
        if (masteredSkillsSet.has(node.id)) {
          skillStates.set(node.id, 'mastered');
        } else {
          // Unlock once prerequisites have been completed (≥1 challenge each)
          const unmetPrerequisites = node.prerequisites.filter(
            prereqId => !completedSkillsSet.has(prereqId)
          );

          const state = unmetPrerequisites.length === 0 ? 'unlocked' : 'locked';
          skillStates.set(node.id, state);
        }
      }

      // Cache the skill states for faster subsequent access
      skillProgressionCache.setSkillStates(userId, graphId, skillStates);

      return skillStates;
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to get all skill states: ${error}`,
        'ALL_SKILL_STATES_ERROR',
        undefined,
        userId
      );
    }
  }

  /**
   * Validate skill graph for circular dependencies and consistency
   */
  validateSkillGraph(skillGraph: SkillGraph): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const skillIds = new Set(skillGraph.nodes.map(node => node.id));

    // Check for circular dependencies using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (skillId: string): boolean => {
      if (recursionStack.has(skillId)) {
        return true; // Cycle detected
      }
      if (visited.has(skillId)) {
        return false; // Already processed
      }

      visited.add(skillId);
      recursionStack.add(skillId);

      const skill = skillGraph.nodes.find(node => node.id === skillId);
      if (skill) {
        for (const prereqId of skill.prerequisites) {
          if (hasCycle(prereqId)) {
            return true;
          }
        }
      }

      recursionStack.delete(skillId);
      return false;
    };

    // Check each skill for cycles
    for (const node of skillGraph.nodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        errors.push(`Circular dependency detected involving skill: ${node.id}`);
      }
    }

    // Check for invalid prerequisites
    for (const node of skillGraph.nodes) {
      for (const prereqId of node.prerequisites) {
        if (!skillIds.has(prereqId)) {
          errors.push(`Skill ${node.id} has invalid prerequisite: ${prereqId}`);
        }
      }
    }

    // Check for duplicate skill IDs
    const duplicateIds = skillGraph.nodes
      .map(node => node.id)
      .filter((id, index, arr) => arr.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      errors.push(`Duplicate skill IDs found: ${duplicateIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get prerequisite chain for a skill (all skills that must be completed)
   */
  getPrerequisiteChain(skillId: string, skillGraph: SkillGraph): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const collectPrerequisites = (currentSkillId: string) => {
      if (visited.has(currentSkillId)) {
        return; // Avoid infinite loops
      }
      visited.add(currentSkillId);

      const skill = skillGraph.nodes.find(node => node.id === currentSkillId);
      if (skill) {
        for (const prereqId of skill.prerequisites) {
          if (!chain.includes(prereqId)) {
            chain.push(prereqId);
          }
          collectPrerequisites(prereqId);
        }
      }
    };

    collectPrerequisites(skillId);
    return chain;
  }

  /**
   * Generate a unique ID for a skill graph for caching purposes
   */
  private generateGraphId(skillGraph: SkillGraph): string {
    // Create a hash based on skill IDs and their prerequisites
    const graphSignature = skillGraph.nodes
      .map(node => `${node.id}:${node.prerequisites.sort().join(',')}`)
      .sort()
      .join('|');

    // Simple hash function (for production, consider using a proper hash library)
    let hash = 0;
    for (let i = 0; i < graphSignature.length; i++) {
      const char = graphSignature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `graph_${Math.abs(hash)}`;
  }

  /**
   * Invalidate skill states cache when progress changes
   */
  invalidateSkillStatesCache(userId: string, graphId?: string): void {
    skillProgressionCache.invalidateSkillStates(userId, graphId);
  }
}

// Export singleton instance
export const skillProgressionManager = new SkillProgressionManager();