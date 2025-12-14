'use client';

// ============================================
// Skill Configuration Admin Interface
// Admin interface for managing skill configurations
// ============================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type {
  SkillConfiguration,
  DifficultyLevel
} from '@/types/skill-progression';
import {
  skillConfigurationManager,
  ConfigurationUpdateRequest,
  ConfigurationValidationResult
} from '@/lib/services/skill-configuration-manager';
import {
  skillConfigurationExport,
  ConfigurationExport,
  ImportExecutionResult
} from '@/lib/services/skill-configuration-export';
import { SkillGraph } from '@/lib/services/skill-progression-manager';

interface SkillConfigurationAdminProps {
  skillGraph: SkillGraph;
  onConfigurationUpdate?: (skillId: string, config: SkillConfiguration) => void;
}

interface ConfigurationFormData {
  skillId: string;
  minSuccessRate: number;
  challengesRequired: number;
  maxChallenges: number;
  startingDifficulty: DifficultyLevel;
  adaptiveScaling: boolean;
  challengeTypes: string[];
}

export function SkillConfigurationAdmin({ 
  skillGraph, 
  onConfigurationUpdate 
}: SkillConfigurationAdminProps) {
  const { toast } = useToast();
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [configurations, setConfigurations] = useState<Map<string, SkillConfiguration>>(new Map());
  const [formData, setFormData] = useState<ConfigurationFormData>({
    skillId: '',
    minSuccessRate: 0.8,
    challengesRequired: 3,
    maxChallenges: 10,
    startingDifficulty: 'Medium',
    adaptiveScaling: true,
    challengeTypes: []
  });
  const [validation, setValidation] = useState<ConfigurationValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [challengeTypesInput, setChallengeTypesInput] = useState('');
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null);

  // Load existing configurations
  useEffect(() => {
    loadConfigurations();
  }, [skillGraph]);

  // Update form when skill selection changes
  useEffect(() => {
    if (selectedSkill) {
      loadSkillConfiguration(selectedSkill);
    }
  }, [selectedSkill]);

  // Validate configuration when form data changes
  useEffect(() => {
    if (formData.skillId) {
      validateCurrentConfiguration();
    }
  }, [formData]);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const skillIds = skillGraph.nodes.map(node => node.id);
      const configs = await Promise.all(
        skillIds.map(async (skillId) => {
          try {
            return await skillConfigurationManager.getSkillConfigurationWithDefaults(skillId, skillGraph);
          } catch (error) {
            console.error(`Failed to load configuration for skill ${skillId}:`, error);
            return null;
          }
        })
      );

      const configMap = new Map<string, SkillConfiguration>();
      configs.forEach(config => {
        if (config) {
          configMap.set(config.skillId, config);
        }
      });

      setConfigurations(configMap);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load skill configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSkillConfiguration = async (skillId: string) => {
    try {
      const config = await skillConfigurationManager.getSkillConfigurationWithDefaults(skillId, skillGraph);
      
      setFormData({
        skillId: config.skillId,
        minSuccessRate: config.masteryThreshold.minSuccessRate,
        challengesRequired: config.masteryThreshold.challengesRequired,
        maxChallenges: config.masteryThreshold.maxChallenges,
        startingDifficulty: config.difficultyProgression.startingDifficulty,
        adaptiveScaling: config.difficultyProgression.adaptiveScaling,
        challengeTypes: config.challengeTypes
      });

      setChallengeTypesInput(config.challengeTypes.join(', '));
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load configuration for skill ${skillId}`,
        variant: 'destructive'
      });
    }
  };

  const validateCurrentConfiguration = () => {
    const configRequest: ConfigurationUpdateRequest = {
      skillId: formData.skillId,
      masteryThreshold: {
        minSuccessRate: formData.minSuccessRate,
        challengesRequired: formData.challengesRequired,
        maxChallenges: formData.maxChallenges
      },
      difficultyProgression: {
        startingDifficulty: formData.startingDifficulty,
        adaptiveScaling: formData.adaptiveScaling
      },
      challengeTypes: formData.challengeTypes
    };

    const validationResult = skillConfigurationManager.validateConfiguration(configRequest, skillGraph);
    setValidation(validationResult);
  };

  const handleSaveConfiguration = async () => {
    if (!validation?.isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix validation errors before saving',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const configRequest: ConfigurationUpdateRequest = {
        skillId: formData.skillId,
        masteryThreshold: {
          minSuccessRate: formData.minSuccessRate,
          challengesRequired: formData.challengesRequired,
          maxChallenges: formData.maxChallenges
        },
        difficultyProgression: {
          startingDifficulty: formData.startingDifficulty,
          adaptiveScaling: formData.adaptiveScaling
        },
        challengeTypes: formData.challengeTypes
      };

      const savedConfig = await skillConfigurationManager.updateSkillConfiguration(configRequest, skillGraph);
      
      // Update local state
      setConfigurations(prev => new Map(prev.set(savedConfig.skillId, savedConfig)));
      
      // Notify parent component
      onConfigurationUpdate?.(savedConfig.skillId, savedConfig);

      toast({
        title: 'Success',
        description: 'Configuration saved successfully',
      });

      if (validation.warnings.length > 0) {
        toast({
          title: 'Warnings',
          description: validation.warnings.join('; '),
          variant: 'default'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeTypesChange = (value: string) => {
    setChallengeTypesInput(value);
    const types = value.split(',').map(type => type.trim()).filter(type => type.length > 0);
    setFormData(prev => ({ ...prev, challengeTypes: types }));
  };

  const handleBulkValidation = async () => {
    try {
      setLoading(true);
      const allConfigs = Array.from(configurations.values()).map(config => ({
        id: config.id || '',
        skillId: config.skillId,
        masteryThreshold: config.masteryThreshold,
        difficultyProgression: config.difficultyProgression,
        challengeTypes: config.challengeTypes,
        createdAt: config.createdAt || new Date(),
        updatedAt: config.updatedAt || new Date()
      }));

      const dependencyCheck = await skillConfigurationManager.checkDependencyConsistency(skillGraph, allConfigs);
      
      if (dependencyCheck.isValid) {
        toast({
          title: 'Validation Passed',
          description: 'All configurations are consistent',
        });
      } else {
        toast({
          title: 'Validation Issues',
          description: dependencyCheck.errors.concat(dependencyCheck.warnings).join('; '),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportConfigurations = async () => {
    try {
      setLoading(true);
      const skillIds = Array.from(configurations.keys());
      const exportData = await skillConfigurationExport.exportConfigurations(skillIds, {
        includeDefaults: true,
        description: 'Admin export',
        exportedBy: 'admin'
      });

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skill-configurations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Exported ${skillIds.length} configurations`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportConfigurations = async () => {
    try {
      setLoading(true);
      setImportResult(null);

      let parsedData: ConfigurationExport;
      try {
        parsedData = JSON.parse(importData);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      const result = await skillConfigurationExport.importConfigurations(
        parsedData,
        skillGraph,
        {
          overwriteExisting: true,
          skipInvalid: true
        }
      );

      setImportResult(result);

      if (result.success) {
        toast({
          title: 'Import Successful',
          description: `Imported ${result.imported} configurations`,
        });
        // Reload configurations
        await loadConfigurations();
      } else {
        toast({
          title: 'Import Completed with Issues',
          description: `Imported: ${result.imported}, Failed: ${result.failed}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedSkillNode = skillGraph.nodes.find(node => node.id === selectedSkill);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skill Configuration Management</h2>
        <div className="flex items-center gap-4">
          <Button onClick={handleBulkValidation} disabled={loading}>
            Validate All Configurations
          </Button>
          <Button onClick={handleExportConfigurations} disabled={loading} variant="outline">
            Export Configurations
          </Button>
          <Button 
            onClick={() => setShowImportExport(!showImportExport)} 
            disabled={loading} 
            variant="outline"
          >
            Import/Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Skill</h3>
          <div className="space-y-2">
            {skillGraph.nodes.map(skill => (
              <div
                key={skill.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedSkill === skill.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSkill(skill.id)}
              >
                <div className="font-medium">{skill.title}</div>
                <div className="text-sm text-gray-600">
                  {skill.engine} • {skill.difficulty}
                </div>
                {configurations.has(skill.id) && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ Configured
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Configuration Form */}
        {selectedSkill && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Configure: {selectedSkillNode?.title}
            </h3>

            <div className="space-y-4">
              {/* Mastery Threshold */}
              <div>
                <h4 className="font-medium mb-2">Mastery Threshold</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Min Success Rate
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.minSuccessRate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        minSuccessRate: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Challenges Required
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.challengesRequired}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        challengesRequired: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">
                    Max Challenges
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxChallenges}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      maxChallenges: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>

              {/* Difficulty Progression */}
              <div>
                <h4 className="font-medium mb-2">Difficulty Progression</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Starting Difficulty
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.startingDifficulty}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        startingDifficulty: e.target.value as DifficultyLevel
                      }))}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.adaptiveScaling}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          adaptiveScaling: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      Adaptive Scaling
                    </label>
                  </div>
                </div>
              </div>

              {/* Challenge Types */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Challenge Types (comma-separated)
                </label>
                <Input
                  value={challengeTypesInput}
                  onChange={(e) => handleChallengeTypesChange(e.target.value)}
                  placeholder="coding, multiple-choice, problem-solving"
                />
              </div>

              {/* Validation Results */}
              {validation && (
                <div className="space-y-2">
                  {validation.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-medium text-red-800 mb-1">Errors:</h5>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <h5 className="font-medium text-yellow-800 mb-1">Warnings:</h5>
                      <ul className="text-sm text-yellow-700 list-disc list-inside">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.isValid && validation.warnings.length === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm text-green-700">✓ Configuration is valid</span>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSaveConfiguration}
                disabled={loading || !validation?.isValid}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Import/Export Panel */}
      {showImportExport && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Import/Export Configurations</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Import Configuration JSON
              </label>
              <textarea
                className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                placeholder="Paste configuration JSON here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleImportConfigurations}
                disabled={loading || !importData.trim()}
              >
                Import Configurations
              </Button>
              <Button
                onClick={() => {
                  const template = skillConfigurationExport.generateConfigurationTemplate(
                    skillGraph.nodes.map(n => n.id),
                    skillGraph
                  );
                  setImportData(JSON.stringify(template, null, 2));
                }}
                variant="outline"
              >
                Generate Template
              </Button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Import Results</h4>
                <div className="text-sm space-y-1">
                  <div>Imported: {importResult.imported}</div>
                  <div>Skipped: {importResult.skipped}</div>
                  <div>Failed: {importResult.failed}</div>
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <h5 className="font-medium text-red-800 mb-1">Errors:</h5>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <h5 className="font-medium text-yellow-800 mb-1">Warnings:</h5>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {importResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}