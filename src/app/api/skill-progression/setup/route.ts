// ============================================
// Skill Progression System Setup API
// Endpoint to initialize the skill progression system
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeSkillProgressionSystem, 
  verifySkillProgressionTables,
  getSkillProgressionStats 
} from '@/lib/services/skill-progression-setup';

export async function POST(request: NextRequest) {
  try {
    // Verify tables exist first
    const tablesExist = await verifySkillProgressionTables();
    
    if (!tablesExist) {
      return NextResponse.json(
        { 
          error: 'Skill progression tables are not accessible. Please run the database migration first.' 
        },
        { status: 500 }
      );
    }

    // Initialize the system
    await initializeSkillProgressionSystem();

    // Get stats to confirm setup
    const stats = await getSkillProgressionStats();

    return NextResponse.json({
      message: 'Skill progression system initialized successfully',
      stats
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize skill progression system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current system stats
    const stats = await getSkillProgressionStats();
    const tablesExist = await verifySkillProgressionTables();

    return NextResponse.json({
      tablesExist,
      stats,
      status: tablesExist ? 'ready' : 'needs_migration'
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}