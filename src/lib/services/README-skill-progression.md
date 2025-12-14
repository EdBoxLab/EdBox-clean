# Skill Progression System

This directory contains the core implementation of the skill progression and challenge system for the engine-native learning platform.

## Overview

The skill progression system provides:
- Dynamic challenge generation using AI
- Skill unlocking mechanics based on prerequisites
- Progress tracking with mastery thresholds
- Adaptive difficulty based on user performance
- Comprehensive progress persistence

## Database Schema

The system uses three main tables:

### `user_skill_progress`
Tracks detailed progress for each user-skill combination:
- `challenges_completed`: Number of successfully completed challenges
- `challenges_required`: Number of challenges needed for mastery
- `success_rate`: Overall success rate for the skill
- `mastery_achieved`: Boolean indicating if skill is mastered
- `xp_earned`: Total XP earned from this skill

### `challenge_attempts`
Records individual challenge attempts:
- `success`: Whether the attempt was successful
- `time_spent`: Time spent on the challenge (seconds)
- `hints_used`: Number of hints used
- `difficulty_level`: Easy, Medium, or Hard
- `feedback`: System-generated feedback

### `skill_configurations`
Stores mastery thresholds and settings per skill:
- `min_success_rate`: Minimum success rate required for mastery
- `challenges_required`: Minimum challenges needed for mastery
- `max_challenges`: Maximum challenges available
- `starting_difficulty`: Initial difficulty level
- `adaptive_scaling`: Whether to adjust difficulty based on performance

## Core Services

### `SkillProgressionDatabase`
Main database service providing:
- `recordChallengeAttempt()`: Records attempts and updates progress
- `getSkillProgress()`: Retrieves progress for a specific skill
- `getUserProgressAll()`: Gets all progress for a user
- `getChallengeAttempts()`: Retrieves attempt history
- `getSkillConfiguration()`: Gets skill configuration
- `getMasteredSkills()`: Lists mastered skills for a user

### Setup Functions
- `initializeSkillProgressionSystem()`: Seeds default skill configurations
- `verifySkillProgressionTables()`: Checks table accessibility
- `getSkillProgressionStats()`: Returns system statistics

## Usage

### 1. Initialize the System
```typescript
import { initializeSkillProgressionSystem } from '@/lib/services/skill-progression-setup';

await initializeSkillProgressionSystem();
```

### 2. Record a Challenge Attempt
```typescript
import { skillProgressionDb } from '@/lib/services/skill-progression-db';

const result = await skillProgressionDb.recordChallengeAttempt(
  userId,
  'javascript-basics',
  'challenge-001',
  true, // success
  {
    timeSpent: 120, // 2 minutes
    hintsUsed: 1,
    difficultyLevel: 'Medium'
  }
);

console.log('Mastery achieved:', result.masteryAchieved);
console.log('XP awarded:', result.xpAwarded);
```

### 3. Get User Progress
```typescript
const progress = await skillProgressionDb.getSkillProgress(userId, 'javascript-basics');
console.log(`Progress: ${progress.challengesCompleted}/${progress.challengesRequired}`);
console.log(`Success rate: ${(progress.successRate * 100).toFixed(1)}%`);
```

### 4. Check Mastered Skills
```typescript
const masteredSkills = await skillProgressionDb.getMasteredSkills(userId);
console.log('Mastered skills:', masteredSkills);
```

## Database Functions

The system includes PostgreSQL functions for atomic operations:

### `record_challenge_attempt()`
Atomically records an attempt and updates progress, returning:
- Updated success rate
- Challenges completed count
- Mastery achievement status
- XP awarded

### `get_skill_progress()`
Returns comprehensive progress data for a user-skill combination.

## API Endpoints

### `POST /api/skill-progression/setup`
Initializes the system with default skill configurations.

### `GET /api/skill-progression/setup`
Returns system status and statistics.

## Migration

Run the migration file to create the database schema:
```sql
-- Execute: supabase/migrations/0011_skill_progression_system.sql
```

## Default Skills

The system comes with configurations for:
- `javascript-basics` (Easy, 3 challenges required)
- `python-fundamentals` (Easy, 3 challenges required)
- `html-css-basics` (Easy, 2 challenges required)
- `react-components` (Medium, 4 challenges required)
- `database-queries` (Medium, 3 challenges required)
- `algorithms-sorting` (Hard, 5 challenges required)
- `data-structures` (Hard, 5 challenges required)

## Error Handling

The system includes custom error types:
- `SkillProgressionError`: General system errors
- `ChallengeGenerationError`: AI generation failures
- `ProgressTrackingError`: Progress update failures

All database operations are wrapped in try-catch blocks with appropriate error handling and logging.