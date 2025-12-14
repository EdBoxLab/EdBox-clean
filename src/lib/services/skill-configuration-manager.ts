// ============================================
// Skill Configuration Management Service
// Handles configuration validation, dependency checking, and migration
// ============================================

import type {
  SkillConfiguration,
  DifficultyLevel,
  SkillState
} from '@/types/skill-progression';
import {
  SkillProgressionError
} from '@/types/skill-progression';
import { skillProgressionDb } from './skill-progression-db';
import { SkillGraph, SkillNode } from './skill-progression-manager';

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration migration result
 */
export interface ConfigurationMigrationResult {
  success: boolean;
  migratedUsers: number;
  errors: string[];
}

/**
 * Configuration update request
 */
export interface ConfigurationUpdateRequest {
  skillId: string;
  masteryThreshold: {
    minSuccessRate: number;
    challengesRequired: number;
    maxChallenges: number;
  };
  difficultyProgression: {
    startingDifficulty: DifficultyLevel;
    adaptiveScaling: boolean;
  };
  challengeTypes: string[];
}

/**
 * Service for managing skill configurations
 */
export class SkillConfigurationManager {
  private db = skillProgressionDb;

  /**
   * Validate a skill configuration for correctness and consistency
   */
  validateConfiguration(
    config: ConfigurationUpdateRequest,
    skillGraph?: SkillGraph
  ): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate mastery threshold values
    if (config.masteryThreshold.minSuccessRate < 0 || config.masteryThreshold.minSuccessRate > 1) {
      errors.push('Minimum success rate must be between 0 and 1');
    }

    if (config.masteryThreshold.challengesRequired < 1) {
      errors.push('Challenges required must be at least 1');
    }

    if (config.masteryThreshold.maxChallenges < config.masteryThreshold.challengesRequired) {
      errors.push('Maximum challenges must be greater than or equal to challenges required');
    }

    if (config.masteryThreshold.maxChallenges > 20) {
      warnings.push('Maximum challenges exceeds recommended limit of 20');
    }

    // Validate difficulty progression
    const validDifficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];
    if (!validDifficulties.includes(config.difficultyProgression.startingDifficulty)) {
      errors.push('Starting difficulty must be Easy, Medium, or Hard');
    }

    // Validate challenge types
    if (config.challengeTypes.length === 0) {
      warnings.push('No challenge types specified - will use default types');
    }

    // Check for reasonable thresholds
    if (config.masteryThreshold.minSuccessRate > 0.95) {
      warnings.push('Very high success rate requirement may be too difficult for learners');
    }

    if (config.masteryThreshold.minSuccessRate < 0.5) {
      warnings.push('Low success rate requirement may not ensure adequate mastery');
    }

    // Validate against skill graph if provided
    if (skillGraph) {
      const skill = skillGraph.nodes.find(node => node.id === config.skillId);
      if (!skill) {
        errors.push(`Skill ${config.skillId} not found in skill graph`);
      } else {
        // Check consistency with skill difficulty
        if (skill.difficulty === 'Easy' && config.difficultyProgression.startingDifficulty === 'Hard') {
          warnings.push('Starting with Hard difficulty for an Easy skill may be inappropriate');
        }
        if (skill.difficulty === 'Hard' && config.difficultyProgression.startingDifficulty === 'Easy') {
          warnings.push('Starting with Easy difficulty for a Hard skill may not prepare learners adequately');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check dependency consistency across skill configurations
   */
  async checkDependencyConsistency(
    skillGraph: SkillGraph,
    configurations?: SkillConfiguration[]
  ): Promise<ConfigurationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get all configurations if not provided
      if (!configurations) {
        const skillIds = skillGraph.nodes.map(node => node.id);
        configurations = await this.db.getSkillConfigurations(skillIds);
      }

      const configMap = new Map<string, SkillConfiguration>();
      configurations.forEach(config => configMap.set(config.skillId, config));

      // Check each skill's prerequisites
      for (const skill of skillGraph.nodes) {
        const skillConfig = configMap.get(skill.id);
        if (!skillConfig) {
          warnings.push(`No configuration found for skill ${skill.id}`);
          continue;
        }

        // Check prerequisite difficulty progression
        for (const prereqId of skill.prerequisites) {
          const prereqConfig = configMap.get(prereqId);
          if (!prereqConfig) {
            warnings.push(`No configuration found for prerequisite skill ${prereqId}`);
            continue;
          }

          // Prerequisite should not be significantly harder to master than dependent skill
          if (prereqConfig.masteryThreshold.minSuccessRate > skillConfig.masteryThreshold.minSuccessRate + 0.2) {
            warnings.push(
              `Prerequisite ${prereqId} has much higher mastery requirement than dependent skill ${skill.id}`
            );
          }

          // Prerequisite should not require significantly more challenges
          if (prereqConfig.masteryThreshold.challengesRequired > skillConfig.masteryThreshold.challengesRequired * 2) {
            warnings.push(
              `Prerequisite ${prereqId} requires significantly more challenges than dependent skill ${skill.id}`
            );
          }
        }

        // Check for reasonable progression in skill chains
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        for (const prereqId of skill.prerequisites) {
          const prereqSkill = skillGraph.nodes.find(node => node.id === prereqId);
          if (prereqSkill) {
            const skillDifficultyLevel = difficultyOrder[skill.difficulty];
            const prereqDifficultyLevel = difficultyOrder[prereqSkill.difficulty];
            
            if (prereqDifficultyLevel > skillDifficultyLevel) {
              warnings.push(
                `Prerequisite ${prereqId} (${prereqSkill.difficulty}) is harder than dependent skill ${skill.id} (${skill.difficulty})`
              );
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to check dependency consistency: ${error}`,
        'DEPENDENCY_CHECK_ERROR'
      );
    }
  }

  /**
   * Create or update a skill configuration with validation
   */
  async updateSkillConfiguration(
    config: ConfigurationUpdateRequest,
    skillGraph?: SkillGraph
  ): Promise<SkillConfiguration> {
    try {
      // Validate the configuration
      const validation = this.validateConfiguration(config, skillGraph);
      if (!validation.isValid) {
        throw new SkillProgressionError(
          `Configuration validation failed: ${validation.errors.join(', ')}`,
          'CONFIGURATION_INVALID',
          config.skillId
        );
      }

      // Create the configuration object
      const configToSave = {
        skillId: config.skillId,
        masteryThreshold: config.masteryThreshold,
        difficultyProgression: config.difficultyProgression,
        challengeTypes: config.challengeTypes
      };

      // Save to database
      const savedConfig = await this.db.upsertSkillConfiguration(configToSave);

      return savedConfig;
    } catch (error) {
      if (error instanceof SkillProgressionError) {
        throw error;
      }
      throw new SkillProgressionError(
        `Failed to update skill configuration: ${error}`,
        'CONFIGURATION_UPDATE_ERROR',
        config.skillId
      );
    }
  }

  /**
   * Get configuration with defaults if not found
   */
  async getSkillConfigurationWithDefaults(
    skillId: string,
    skillGraph?: SkillGraph
  ): Promise<SkillConfiguration> {
    try {
      // Try to get existing configuration
      const existingConfig = await this.db.getSkillConfiguration(skillId);
      if (existingConfig) {
        return existingConfig;
      }

      // Create default configuration
      const skill = skillGraph?.nodes.find(node => node.id === skillId);
      const defaultConfig = this.createDefaultConfiguration(skillId, skill);

      // Save default configuration
      return await this.db.upsertSkillConfiguration(defaultConfig);
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to get skill configuration: ${error}`,
        'CONFIGURATION_GET_ERROR',
        skillId
      );
    }
  }

  /**
   * Migrate existing user progress when configuration changes
   */
  async migrateUserProgress(
    skillId: string,
    oldConfig: SkillConfiguration,
    newConfig: SkillConfiguration
  ): Promise<ConfigurationMigrationResult> {
    try {
      const errors: string[] = [];
      let migratedUsers = 0;

      // This is a simplified migration - in a real system, you'd need more sophisticated logic
      // For now, we'll just validate that the migration is safe

      // Check if the new configuration is more restrictive
      const isMoreRestrictive = 
        newConfig.masteryThreshold.minSuccessRate > oldConfig.masteryThreshold.minSuccessRate ||
        newConfig.masteryThreshold.challengesRequired > oldConfig.masteryThreshold.challengesRequired;

      if (isMoreRestrictive) {
        errors.push('New configuration is more restrictive - manual review required for existing progress');
      }

      // Check if the new configuration is less restrictive
      const isLessRestrictive = 
        newConfig.masteryThreshold.minSuccessRate < oldConfig.masteryThreshold.minSuccessRate ||
        newConfig.masteryThreshold.challengesRequired < oldConfig.masteryThreshold.challengesRequired;

      if (isLessRestrictive) {
        // This is generally safe - users who didn't meet old criteria might now meet new criteria
        // In a real implementation, you'd update user progress records here
        migratedUsers = 0; // Placeholder - would be actual count from database operation
      }

      return {
        success: errors.length === 0,
        migratedUsers,
        errors
      };
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to migrate user progress: ${error}`,
        'MIGRATION_ERROR',
        skillId
      );
    }
  }

  /**
   * Bulk update configurations with validation
   */
  async bulkUpdateConfigurations(
    configs: ConfigurationUpdateRequest[],
    skillGraph: SkillGraph
  ): Promise<{ successful: SkillConfiguration[]; failed: Array<{ config: ConfigurationUpdateRequest; error: string }> }> {
    const successful: SkillConfiguration[] = [];
    const failed: Array<{ config: ConfigurationUpdateRequest; error: string }> = [];

    // Validate all configurations first
    for (const config of configs) {
      const validation = this.validateConfiguration(config, skillGraph);
      if (!validation.isValid) {
        failed.push({
          config,
          error: validation.errors.join(', ')
        });
      }
    }

    // Check overall dependency consistency
    const validConfigs = configs.filter(config => 
      !failed.some(f => f.config.skillId === config.skillId)
    );

    if (validConfigs.length > 0) {
      // Convert to SkillConfiguration format for consistency check
      const configsForCheck = validConfigs.map(config => ({
        id: '',
        skillId: config.skillId,
        masteryThreshold: config.masteryThreshold,
        difficultyProgression: config.difficultyProgression,
        challengeTypes: config.challengeTypes,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const dependencyCheck = await this.checkDependencyConsistency(skillGraph, configsForCheck);
      if (!dependencyCheck.isValid) {
        // Mark all as failed if dependency consistency fails
        for (const config of validConfigs) {
          failed.push({
            config,
            error: `Dependency consistency check failed: ${dependencyCheck.errors.join(', ')}`
          });
        }
        return { successful, failed };
      }
    }

    // Save valid configurations
    for (const config of validConfigs) {
      try {
        const savedConfig = await this.updateSkillConfiguration(config, skillGraph);
        successful.push(savedConfig);
      } catch (error) {
        failed.push({
          config,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Create default configuration for a skill
   */
  private createDefaultConfiguration(skillId: string, skill?: SkillNode): Omit<SkillConfiguration, 'id' | 'createdAt' | 'updatedAt'> {
    // Base defaults
    let defaultConfig = {
      skillId,
      masteryThreshold: {
        minSuccessRate: 0.8,
        challengesRequired: 3,
        maxChallenges: 10
      },
      difficultyProgression: {
        startingDifficulty: 'Medium' as DifficultyLevel,
        adaptiveScaling: true
      },
      challengeTypes: ['coding', 'multiple-choice', 'problem-solving']
    };

    // Adjust based on skill difficulty if available
    if (skill) {
      switch (skill.difficulty) {
        case 'Easy':
          defaultConfig.masteryThreshold.minSuccessRate = 0.7;
          defaultConfig.masteryThreshold.challengesRequired = 2;
          defaultConfig.difficultyProgression.startingDifficulty = 'Easy';
          break;
        case 'Hard':
          defaultConfig.masteryThreshold.minSuccessRate = 0.85;
          defaultConfig.masteryThreshold.challengesRequired = 5;
          defaultConfig.difficultyProgression.startingDifficulty = 'Medium';
          break;
        default:
          // Keep defaults for Medium
          break;
      }

      // Adjust challenge types based on engine
      switch (skill.engine) {
        case 'codestudio':
          defaultConfig.challengeTypes = ['coding', 'debugging', 'algorithm'];
          break;
        case 'mathlab':
          defaultConfig.challengeTypes = ['calculation', 'proof', 'problem-solving'];
          break;
        case 'writingstudio':
          defaultConfig.challengeTypes = ['essay', 'analysis', 'creative'];
          break;
        default:
          // Keep default challenge types
          break;
      }
    }

    return defaultConfig;
  }

  /**
   * Export configurations for backup or transfer
   */
  async exportConfigurations(skillIds?: string[]): Promise<SkillConfiguration[]> {
    try {
      if (skillIds) {
        return await this.db.getSkillConfigurations(skillIds);
      } else {
        // Get all configurations - this would need a new database method
        // For now, throw an error to indicate this needs implementation
        throw new SkillProgressionError(
          'Export all configurations not yet implemented',
          'EXPORT_NOT_IMPLEMENTED'
        );
      }
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to export configurations: ${error}`,
        'EXPORT_ERROR'
      );
    }
  }

  /**
   * Import configurations from backup
   */
  async importConfigurations(
    configurations: Omit<SkillConfiguration, 'id' | 'createdAt' | 'updatedAt'>[],
    skillGraph: SkillGraph,
    overwriteExisting: boolean = false
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const config of configurations) {
      try {
        // Check if configuration already exists
        const existing = await this.db.getSkillConfiguration(config.skillId);
        if (existing && !overwriteExisting) {
          skipped++;
          continue;
        }

        // Validate configuration
        const validation = this.validateConfiguration(config, skillGraph);
        if (!validation.isValid) {
          errors.push(`Skill ${config.skillId}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Import configuration
        await this.db.upsertSkillConfiguration(config);
        imported++;
      } catch (error) {
        errors.push(`Skill ${config.skillId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { imported, skipped, errors };
  }
}

// Export singleton instance
export const skillConfigurationManager = new SkillConfigurationManager();