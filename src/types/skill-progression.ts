// ============================================
// Skill Progression System - Core Data Models
// TypeScript interfaces matching database schema
// ============================================

/**
 * User progress tracking for individual skills
 */
export interface UserSkillProgress {
  id: string;
  userId: string;
  skillId: string;
  challengesCompleted: number;
  challengesRequired: number;
  successRate: number;
  masteryAchieved: boolean;
  lastAttempt?: Date;
  totalAttempts: number;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual challenge attempt record
 */
export interface ChallengeAttempt {
  id: string;
  userId: string;
  skillId: string;
  challengeId: string;
  success: boolean;
  timeSpent?: number; // in seconds
  hintsUsed: number;
  submissionCode?: string;
  feedback?: string;
  difficultyLevel: DifficultyLevel;
  timestamp: Date;
  createdAt: Date;
}

/**
 * Skill configuration for mastery thresholds and challenge settings
 */
export interface SkillConfiguration {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Difficulty levels for challenges
 */
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

/**
 * Skill state in the progression system
 */
export type SkillState = 'locked' | 'unlocked' | 'mastered';

/**
 * Challenge generation request
 */
export interface ChallengeGenerationRequest {
  skillId: string;
  difficultyLevel: DifficultyLevel;
  challengeType?: string;
  userHistory?: ChallengeAttempt[];
}

/**
 * Generated challenge content
 */
export interface GeneratedChallenge {
  id: string;
  skillId: string;
  title: string;
  description: string;
  starterCode?: string;
  validationCriteria: string[];
  hints: string[];
  difficultyLevel: DifficultyLevel;
  estimatedTime: number; // in minutes
  learningObjectives: string[];
}

/**
 * Challenge pool for a skill
 */
export interface ChallengePool {
  skillId: string;
  challenges: GeneratedChallenge[];
  lastGenerated: Date;
  totalGenerated: number;
}

/**
 * Progress summary for UI display
 */
export interface ProgressSummary {
  skillId: string;
  challengesCompleted: number;
  challengesRequired: number;
  successRate: number;
  masteryAchieved: boolean;
  xpEarned: number;
  totalAttempts: number;
  lastAttempt?: Date;
  progressPercentage: number;
}

/**
 * Skill unlock status with prerequisites
 */
export interface SkillUnlockStatus {
  skillId: string;
  state: SkillState;
  prerequisites: string[];
  unmetPrerequisites: string[];
  canUnlock: boolean;
}

/**
 * Challenge attempt result
 */
export interface ChallengeResult {
  success: boolean;
  masteryAchieved: boolean;
  xpAwarded: number;
  successRate: number;
  challengesCompleted: number;
  challengesRequired: number;
  feedback?: string;
}

/**
 * Adaptive difficulty adjustment parameters
 */
export interface DifficultyAdjustment {
  currentDifficulty: DifficultyLevel;
  suggestedDifficulty: DifficultyLevel;
  reason: string;
  confidenceScore: number;
}

/**
 * Performance metrics for difficulty adaptation
 */
export interface PerformanceMetrics {
  recentSuccessRate: number;
  averageTimeSpent: number;
  hintsUsageRate: number;
  streakLength: number;
  strugglingIndicators: string[];
}

/**
 * Database function response types
 */
export interface RecordChallengeAttemptResponse {
  success: boolean;
  masteryAchieved: boolean;
  xpAwarded: number;
  successRate: number;
  challengesCompleted: number;
  challengesRequired: number;
}

export interface GetSkillProgressResponse {
  skillId: string;
  challengesCompleted: number;
  challengesRequired: number;
  successRate: number;
  masteryAchieved: boolean;
  xpEarned: number;
  totalAttempts: number;
  lastAttempt?: string;
}

/**
 * Error types for the skill progression system
 */
export class SkillProgressionError extends Error {
  constructor(
    message: string,
    public code: string,
    public skillId?: string,
    public userId?: string
  ) {
    super(message);
    this.name = 'SkillProgressionError';
  }
}

export class ChallengeGenerationError extends SkillProgressionError {
  constructor(message: string, skillId: string, public retryable: boolean = true) {
    super(message, 'CHALLENGE_GENERATION_FAILED', skillId);
    this.name = 'ChallengeGenerationError';
  }
}

export class ProgressTrackingError extends SkillProgressionError {
  constructor(message: string, skillId: string, userId: string) {
    super(message, 'PROGRESS_TRACKING_FAILED', skillId, userId);
    this.name = 'ProgressTrackingError';
  }
}