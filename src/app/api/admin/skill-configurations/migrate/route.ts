// ============================================
// Skill Configuration Migration API
// API endpoint for migrating user progress when configurations change
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { skillConfigurationManager } from '@/lib/services/skill-configuration-manager';
import { skillProgressionDb } from '@/lib/services/skill-progression-db';

// POST - Migrate user progress for configuration changes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, oldConfiguration, newConfiguration } = body;

    if (!skillId || !oldConfiguration || !newConfiguration) {
      return NextResponse.json(
        { error: 'Skill ID, old configuration, and new configuration are required' },
        { status: 400 }
      );
    }

    // Perform the migration
    const migrationResult = await skillConfigurationManager.migrateUserProgress(
      skillId,
      oldConfiguration,
      newConfiguration
    );

    return NextResponse.json({
      success: migrationResult.success,
      migratedUsers: migrationResult.migratedUsers,
      errors: migrationResult.errors,
      summary: {
        skillId,
        migrationRequired: !migrationResult.success || migrationResult.migratedUsers > 0,
        hasErrors: migrationResult.errors.length > 0
      }
    });
  } catch (error) {
    console.error('Error migrating user progress:', error);
    return NextResponse.json(
      { error: 'Failed to migrate user progress' },
      { status: 500 }
    );
  }
}

// GET - Preview migration impact
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');
    const oldConfigParam = searchParams.get('oldConfiguration');
    const newConfigParam = searchParams.get('newConfiguration');

    if (!skillId || !oldConfigParam || !newConfigParam) {
      return NextResponse.json(
        { error: 'Skill ID, old configuration, and new configuration are required' },
        { status: 400 }
      );
    }

    let oldConfiguration, newConfiguration;
    try {
      oldConfiguration = JSON.parse(oldConfigParam);
      newConfiguration = JSON.parse(newConfigParam);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      );
    }

    // Analyze the migration impact without actually performing it
    const isMoreRestrictive = 
      newConfiguration.masteryThreshold.minSuccessRate > oldConfiguration.masteryThreshold.minSuccessRate ||
      newConfiguration.masteryThreshold.challengesRequired > oldConfiguration.masteryThreshold.challengesRequired;

    const isLessRestrictive = 
      newConfiguration.masteryThreshold.minSuccessRate < oldConfiguration.masteryThreshold.minSuccessRate ||
      newConfiguration.masteryThreshold.challengesRequired < oldConfiguration.masteryThreshold.challengesRequired;

    const changes = [];
    
    if (newConfiguration.masteryThreshold.minSuccessRate !== oldConfiguration.masteryThreshold.minSuccessRate) {
      changes.push({
        field: 'minSuccessRate',
        oldValue: oldConfiguration.masteryThreshold.minSuccessRate,
        newValue: newConfiguration.masteryThreshold.minSuccessRate,
        impact: newConfiguration.masteryThreshold.minSuccessRate > oldConfiguration.masteryThreshold.minSuccessRate 
          ? 'More restrictive' : 'Less restrictive'
      });
    }

    if (newConfiguration.masteryThreshold.challengesRequired !== oldConfiguration.masteryThreshold.challengesRequired) {
      changes.push({
        field: 'challengesRequired',
        oldValue: oldConfiguration.masteryThreshold.challengesRequired,
        newValue: newConfiguration.masteryThreshold.challengesRequired,
        impact: newConfiguration.masteryThreshold.challengesRequired > oldConfiguration.masteryThreshold.challengesRequired 
          ? 'More restrictive' : 'Less restrictive'
      });
    }

    if (newConfiguration.masteryThreshold.maxChallenges !== oldConfiguration.masteryThreshold.maxChallenges) {
      changes.push({
        field: 'maxChallenges',
        oldValue: oldConfiguration.masteryThreshold.maxChallenges,
        newValue: newConfiguration.masteryThreshold.maxChallenges,
        impact: 'Limit change'
      });
    }

    return NextResponse.json({
      skillId,
      changes,
      migrationAnalysis: {
        isMoreRestrictive,
        isLessRestrictive,
        requiresManualReview: isMoreRestrictive,
        safeToAutoMigrate: isLessRestrictive && !isMoreRestrictive,
        recommendations: [
          ...(isMoreRestrictive ? ['Manual review required for existing user progress'] : []),
          ...(isLessRestrictive ? ['Some users may automatically achieve mastery'] : []),
          ...(!isMoreRestrictive && !isLessRestrictive ? ['No impact on existing progress'] : [])
        ]
      }
    });
  } catch (error) {
    console.error('Error analyzing migration impact:', error);
    return NextResponse.json(
      { error: 'Failed to analyze migration impact' },
      { status: 500 }
    );
  }
}