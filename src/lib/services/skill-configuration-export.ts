// ============================================
// Skill Configuration Export/Import Utilities
// Handles backup, export, and import of skill configurations
// ============================================

import { skillProgressionDb } from './skill-progression-db';
import { skillConfigurationManager } from './skill-configuration-manager';
import type {
  SkillConfiguration,
  DifficultyLevel
} from '@/types/skill-progression';
import {
  SkillProgressionError
} from '@/types/skill-progression';
import { SkillGraph } from './skill-progression-manager';

/**
 * Configuration export format
 */
export interface ConfigurationExport {
  version: string;
  exportDate: string;
  skillConfigurations: SkillConfiguration[];
  metadata: {
    totalConfigurations: number;
    skillIds: string[];
    exportedBy?: string;
    description?: string;
  };
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalConfigurations: number;
    validConfigurations: number;
    invalidConfigurations: number;
    duplicateSkills: string[];
  };
}

/**
 * Import execution result
 */
export interface ImportExecutionResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
  warnings: string[];
  details: Array<{
    skillId: string;
    status: 'imported' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

/**
 * Service for configuration export/import operations
 */
export class SkillConfigurationExport {
  private db = skillProgressionDb;
  private configManager = skillConfigurationManager;

  /**
   * Export configurations to JSON format
   */
  async exportConfigurations(
    skillIds?: string[],
    options: {
      includeDefaults?: boolean;
      description?: string;
      exportedBy?: string;
    } = {}
  ): Promise<ConfigurationExport> {
    try {
      let configurations: SkillConfiguration[];

      if (skillIds && skillIds.length > 0) {
        // Export specific skills
        configurations = await this.db.getSkillConfigurations(skillIds);
        
        // Add default configurations for missing skills if requested
        if (options.includeDefaults) {
          const existingSkillIds = new Set(configurations.map(c => c.skillId));
          const missingSkillIds = skillIds.filter(id => !existingSkillIds.has(id));
          
          for (const skillId of missingSkillIds) {
            try {
              const defaultConfig = await this.configManager.getSkillConfigurationWithDefaults(skillId);
              configurations.push(defaultConfig);
            } catch (error) {
              console.warn(`Failed to get default configuration for skill ${skillId}:`, error);
            }
          }
        }
      } else {
        // Export all configurations - this would need a new database method
        throw new SkillProgressionError(
          'Export all configurations not yet implemented - please specify skill IDs',
          'EXPORT_ALL_NOT_IMPLEMENTED'
        );
      }

      const exportData: ConfigurationExport = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        skillConfigurations: configurations,
        metadata: {
          totalConfigurations: configurations.length,
          skillIds: configurations.map(c => c.skillId),
          exportedBy: options.exportedBy,
          description: options.description
        }
      };

      return exportData;
    } catch (error) {
      throw new SkillProgressionError(
        `Failed to export configurations: ${error}`,
        'EXPORT_ERROR'
      );
    }
  }

  /**
   * Validate imported configuration data
   */
  validateImportData(
    importData: any,
    skillGraph?: SkillGraph
  ): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validConfigurations = 0;
    const duplicateSkills: string[] = [];

    // Validate basic structure
    if (!importData || typeof importData !== 'object') {
      errors.push('Invalid import data format');
      return {
        isValid: false,
        errors,
        warnings,
        summary: {
          totalConfigurations: 0,
          validConfigurations: 0,
          invalidConfigurations: 0,
          duplicateSkills: []
        }
      };
    }

    // Check version compatibility
    if (!importData.version) {
      warnings.push('No version information found in import data');
    } else if (importData.version !== '1.0.0') {
      warnings.push(`Import data version ${importData.version} may not be fully compatible`);
    }

    // Validate configurations array
    if (!Array.isArray(importData.skillConfigurations)) {
      errors.push('skillConfigurations must be an array');
      return {
        isValid: false,
        errors,
        warnings,
        summary: {
          totalConfigurations: 0,
          validConfigurations: 0,
          invalidConfigurations: 0,
          duplicateSkills: []
        }
      };
    }

    const configurations = importData.skillConfigurations;
    const skillIdsSeen = new Set<string>();

    // Validate each configuration
    for (let i = 0; i < configurations.length; i++) {
      const config = configurations[i];
      const configErrors: string[] = [];

      // Check for duplicate skill IDs
      if (skillIdsSeen.has(config.skillId)) {
        duplicateSkills.push(config.skillId);
        configErrors.push('Duplicate skill ID in import data');
      } else {
        skillIdsSeen.add(config.skillId);
      }

      // Validate configuration structure
      if (!config.skillId || typeof config.skillId !== 'string') {
        configErrors.push('Missing or invalid skillId');
      }

      if (!config.masteryThreshold || typeof config.masteryThreshold !== 'object') {
        configErrors.push('Missing or invalid masteryThreshold');
      } else {
        const threshold = config.masteryThreshold;
        
        if (typeof threshold.minSuccessRate !== 'number' || 
            threshold.minSuccessRate < 0 || threshold.minSuccessRate > 1) {
          configErrors.push('Invalid minSuccessRate (must be between 0 and 1)');
        }

        if (typeof threshold.challengesRequired !== 'number' || threshold.challengesRequired < 1) {
          configErrors.push('Invalid challengesRequired (must be positive integer)');
        }

        if (typeof threshold.maxChallenges !== 'number' || 
            threshold.maxChallenges < threshold.challengesRequired) {
          configErrors.push('Invalid maxChallenges (must be >= challengesRequired)');
        }
      }

      if (!config.difficultyProgression || typeof config.difficultyProgression !== 'object') {
        configErrors.push('Missing or invalid difficultyProgression');
      } else {
        const progression = config.difficultyProgression;
        const validDifficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];
        
        if (!validDifficulties.includes(progression.startingDifficulty)) {
          configErrors.push('Invalid startingDifficulty (must be Easy, Medium, or Hard)');
        }

        if (typeof progression.adaptiveScaling !== 'boolean') {
          configErrors.push('Invalid adaptiveScaling (must be boolean)');
        }
      }

      if (!Array.isArray(config.challengeTypes)) {
        configErrors.push('challengeTypes must be an array');
      }

      // Validate against skill graph if provided
      if (skillGraph && config.skillId) {
        const validation = this.configManager.validateConfiguration(
          {
            skillId: config.skillId,
            masteryThreshold: config.masteryThreshold,
            difficultyProgression: config.difficultyProgression,
            challengeTypes: config.challengeTypes
          },
          skillGraph
        );

        if (!validation.isValid) {
          configErrors.push(...validation.errors);
        }
        warnings.push(...validation.warnings);
      }

      if (configErrors.length === 0) {
        validConfigurations++;
      } else {
        errors.push(`Configuration ${i + 1} (${config.skillId || 'unknown'}): ${configErrors.join(', ')}`);
      }
    }

    const totalConfigurations = configurations.length;
    const invalidConfigurations = totalConfigurations - validConfigurations;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalConfigurations,
        validConfigurations,
        invalidConfigurations,
        duplicateSkills
      }
    };
  }

  /**
   * Import configurations from export data
   */
  async importConfigurations(
    importData: ConfigurationExport,
    skillGraph: SkillGraph,
    options: {
      overwriteExisting?: boolean;
      validateOnly?: boolean;
      skipInvalid?: boolean;
    } = {}
  ): Promise<ImportExecutionResult> {
    const result: ImportExecutionResult = {
      success: false,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: [],
      details: []
    };

    try {
      // Validate import data first
      const validation = this.validateImportData(importData, skillGraph);
      
      if (!validation.isValid && !options.skipInvalid) {
        result.errors = validation.errors;
        result.warnings = validation.warnings;
        return result;
      }

      // Add validation warnings to result
      result.warnings.push(...validation.warnings);

      if (options.validateOnly) {
        result.success = validation.isValid;
        return result;
      }

      // Process each configuration
      for (const config of importData.skillConfigurations) {
        try {
          // Check if configuration already exists
          const existingConfig = await this.db.getSkillConfiguration(config.skillId);
          
          if (existingConfig && !options.overwriteExisting) {
            result.skipped++;
            result.details.push({
              skillId: config.skillId,
              status: 'skipped',
              reason: 'Configuration already exists and overwrite not enabled'
            });
            continue;
          }

          // Validate individual configuration
          const configValidation = this.configManager.validateConfiguration(
            {
              skillId: config.skillId,
              masteryThreshold: config.masteryThreshold,
              difficultyProgression: config.difficultyProgression,
              challengeTypes: config.challengeTypes
            },
            skillGraph
          );

          if (!configValidation.isValid) {
            if (options.skipInvalid) {
              result.failed++;
              result.details.push({
                skillId: config.skillId,
                status: 'failed',
                reason: configValidation.errors.join(', ')
              });
              continue;
            } else {
              throw new Error(configValidation.errors.join(', '));
            }
          }

          // Import the configuration
          await this.db.upsertSkillConfiguration({
            skillId: config.skillId,
            masteryThreshold: config.masteryThreshold,
            difficultyProgression: config.difficultyProgression,
            challengeTypes: config.challengeTypes
          });

          result.imported++;
          result.details.push({
            skillId: config.skillId,
            status: 'imported'
          });

          // Add any warnings from validation
          if (configValidation.warnings.length > 0) {
            result.warnings.push(`${config.skillId}: ${configValidation.warnings.join(', ')}`);
          }

        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`Failed to import ${config.skillId}: ${errorMessage}`);
          result.details.push({
            skillId: config.skillId,
            status: 'failed',
            reason: errorMessage
          });
        }
      }

      result.success = result.failed === 0;
      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  /**
   * Create a backup of current configurations
   */
  async createBackup(
    skillIds: string[],
    description?: string
  ): Promise<{ success: boolean; backupData?: ConfigurationExport; error?: string }> {
    try {
      const backupData = await this.exportConfigurations(skillIds, {
        includeDefaults: true,
        description: description || `Backup created on ${new Date().toISOString()}`,
        exportedBy: 'system'
      });

      return { success: true, backupData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate configuration template for new skills
   */
  generateConfigurationTemplate(
    skillIds: string[],
    skillGraph?: SkillGraph
  ): ConfigurationExport {
    const configurations: Omit<SkillConfiguration, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const skillId of skillIds) {
      const skill = skillGraph?.nodes.find(node => node.id === skillId);
      
      // Create default configuration based on skill properties
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
        }
      }

      configurations.push(defaultConfig as any);
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      skillConfigurations: configurations as SkillConfiguration[],
      metadata: {
        totalConfigurations: configurations.length,
        skillIds,
        description: 'Generated configuration template'
      }
    };
  }
}

// Export singleton instance
export const skillConfigurationExport = new SkillConfigurationExport();