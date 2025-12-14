// ============================================
// Skill Configuration Admin API Routes
// API endpoints for managing skill configurations
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { skillConfigurationManager } from '@/lib/services/skill-configuration-manager';
import { skillProgressionDb } from '@/lib/services/skill-progression-db';
import type { SkillGraph } from '@/lib/services/skill-progression-manager';

// GET - Retrieve skill configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillIds = searchParams.get('skillIds')?.split(',').filter(Boolean);

    if (skillIds && skillIds.length > 0) {
      const configurations = await skillProgressionDb.getSkillConfigurations(skillIds);
      return NextResponse.json({ configurations });
    } else {
      // Return empty array if no skill IDs provided
      // In a real implementation, you might want to return all configurations
      return NextResponse.json({ configurations: [] });
    }
  } catch (error) {
    console.error('Error fetching skill configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill configurations' },
      { status: 500 }
    );
  }
}

// POST - Create or update skill configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configuration, skillGraph } = body;

    if (!configuration || !skillGraph) {
      return NextResponse.json(
        { error: 'Configuration and skill graph are required' },
        { status: 400 }
      );
    }

    // Validate the configuration
    const validation = skillConfigurationManager.validateConfiguration(configuration, skillGraph);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Configuration validation failed',
          validationErrors: validation.errors,
          validationWarnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // Save the configuration
    const savedConfiguration = await skillConfigurationManager.updateSkillConfiguration(
      configuration,
      skillGraph
    );

    return NextResponse.json({
      configuration: savedConfiguration,
      validationWarnings: validation.warnings
    });
  } catch (error) {
    console.error('Error saving skill configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save skill configuration' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update configurations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configurations, skillGraph } = body;

    if (!configurations || !Array.isArray(configurations) || !skillGraph) {
      return NextResponse.json(
        { error: 'Configurations array and skill graph are required' },
        { status: 400 }
      );
    }

    const result = await skillConfigurationManager.bulkUpdateConfigurations(
      configurations,
      skillGraph
    );

    return NextResponse.json({
      successful: result.successful,
      failed: result.failed,
      summary: {
        total: configurations.length,
        successful: result.successful.length,
        failed: result.failed.length
      }
    });
  } catch (error) {
    console.error('Error bulk updating configurations:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update configurations' },
      { status: 500 }
    );
  }
}