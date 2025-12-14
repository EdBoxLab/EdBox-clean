// ============================================
// Skill Configuration Validation API
// API endpoint for validating configuration consistency
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { skillConfigurationManager } from '@/lib/services/skill-configuration-manager';
import { skillProgressionDb } from '@/lib/services/skill-progression-db';
import type { SkillGraph } from '@/lib/services/skill-progression-manager';

// POST - Validate configuration consistency
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillGraph, configurations } = body;

    if (!skillGraph) {
      return NextResponse.json(
        { error: 'Skill graph is required' },
        { status: 400 }
      );
    }

    let configsToValidate = configurations;

    // If no configurations provided, fetch existing ones
    if (!configsToValidate) {
      const skillIds = skillGraph.nodes.map((node: any) => node.id);
      configsToValidate = await skillProgressionDb.getSkillConfigurations(skillIds);
    }

    // Check dependency consistency
    const validationResult = await skillConfigurationManager.checkDependencyConsistency(
      skillGraph,
      configsToValidate
    );

    return NextResponse.json({
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      summary: {
        totalConfigurations: configsToValidate?.length || 0,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length
      }
    });
  } catch (error) {
    console.error('Error validating configurations:', error);
    return NextResponse.json(
      { error: 'Failed to validate configurations' },
      { status: 500 }
    );
  }
}

// GET - Validate individual configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');
    const skillGraphParam = searchParams.get('skillGraph');

    if (!skillId) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    let skillGraph: SkillGraph | undefined;
    if (skillGraphParam) {
      try {
        skillGraph = JSON.parse(skillGraphParam);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid skill graph format' },
          { status: 400 }
        );
      }
    }

    // Get the configuration
    const configuration = await skillProgressionDb.getSkillConfiguration(skillId);
    if (!configuration) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Validate the configuration
    const validationResult = skillConfigurationManager.validateConfiguration(
      {
        skillId: configuration.skillId,
        masteryThreshold: configuration.masteryThreshold,
        difficultyProgression: configuration.difficultyProgression,
        challengeTypes: configuration.challengeTypes
      },
      skillGraph
    );

    return NextResponse.json({
      skillId,
      configuration,
      validation: validationResult
    });
  } catch (error) {
    console.error('Error validating individual configuration:', error);
    return NextResponse.json(
      { error: 'Failed to validate configuration' },
      { status: 500 }
    );
  }
}