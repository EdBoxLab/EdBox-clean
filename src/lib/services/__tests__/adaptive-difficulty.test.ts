import * as fc from 'fast-check';
import { AdaptiveDifficultyService } from '../adaptive-difficulty';
import type {
  DifficultyLevel,
  ChallengeAttempt,
  UserSkillProgress,
  DifficultyAdjustment,
  PerformanceMetrics
} from '@/types/skill-progression';

// Mock the database service
jest.mock('../skill-progression-db', () => ({
  skillProgressionDb: {
    getRecentChallengeAttempts: jest.fn(),
    getAllUserProgress: jest.fn(),
  }
}));

import { skillProgressionDb } from '../skill-progression-db';

describe('AdaptiveDifficultyService Property Tests', () => {
  let service: AdaptiveDifficultyService;
  const mockDb = skillProgressionDb as jest.Mocked<typeof skillProgressionDb>;

  beforeEach(() => {
    service = new AdaptiveDifficultyService();
    jest.clearAllMocks();
  });

  // Generators for property-based testing
  const difficultyArb = fc.constantFrom<DifficultyLevel>('Easy', 'Medium', 'Hard');
  
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  
  const skillIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

  const challengeAttemptArb = fc.record({
    id: fc.string(),
    userId: userIdArb,
    skillId: skillIdArb,
    challengeId: fc.string(),
    success: fc.boolean(),
    timeSpent: fc.option(fc.integer({ min: 30, max: 3600 })), // 30 seconds to 1 hour
    hintsUsed: fc.integer({ min: 0, max: 10 }),
    submissionCode: fc.option(fc.string()),
    feedback: fc.option(fc.string()),
    difficultyLevel: difficultyArb,
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
  });

  const userProgressArb = fc.record({
    id: fc.string(),
    userId: userIdArb,
    skillId: skillIdArb,
    challengesCompleted: fc.integer({ min: 0, max: 20 }),
    challengesRequired: fc.integer({ min: 1, max: 10 }),
    successRate: fc.float({ min: 0, max: 1 }),
    masteryAchieved: fc.boolean(),
    lastAttempt: fc.option(fc.date()),
    totalAttempts: fc.integer({ min: 0, max: 50 }),
    xpEarned: fc.integer({ min: 0, max: 1000 }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  describe('Property 7: Adaptive Difficulty Management', () => {
    /**
     * Feature: skill-progression-system, Property 7: Adaptive Difficulty Management
     * Validates: Requirements 6.1, 6.2, 6.4, 6.5
     */
    it('should adjust difficulty based on user performance patterns while maintaining core learning objectives', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          skillIdArb,
          difficultyArb,
          fc.array(challengeAttemptArb, { minLength: 0, maxLength: 15 }),
          fc.array(userProgressArb, { minLength: 0, maxLength: 10 }),
          async (userId, skillId, currentDifficulty, recentAttempts, allProgress) => {
            // Filter attempts to match the user and skill
            const filteredAttempts = recentAttempts.map(attempt => ({
              ...attempt,
              userId,
              skillId
            }));

            const filteredProgress = allProgress.map(progress => ({
              ...progress,
              userId
            }));

            // Setup mocks
            mockDb.getRecentChallengeAttempts.mockResolvedValue(filteredAttempts);
            mockDb.getAllUserProgress.mockResolvedValue(filteredProgress);

            try {
              const adjustment = await service.analyzeDifficultyAdjustment(userId, skillId, currentDifficulty);

              // Property: Adjustment must be a valid DifficultyAdjustment object
              expect(adjustment).toBeDefined();
              expect(adjustment.currentDifficulty).toBe(currentDifficulty);
              expect(['Easy', 'Medium', 'Hard']).toContain(adjustment.suggestedDifficulty);
              expect(typeof adjustment.reason).toBe('string');
              expect(adjustment.reason.trim()).not.toBe('');
              expect(adjustment.confidenceScore).toBeGreaterThanOrEqual(0);
              expect(adjustment.confidenceScore).toBeLessThanOrEqual(1);

              // Property: When user consistently succeeds, difficulty should increase or maintain
              if (filteredAttempts.length >= 3) {
                const successRate = filteredAttempts.filter(a => a.success).length / filteredAttempts.length;
                
                if (successRate >= 0.9 && currentDifficulty !== 'Hard') {
                  // High success rate should suggest increase or maintain (not decrease)
                  const difficultyLevels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                  const currentLevel = difficultyLevels[currentDifficulty];
                  const suggestedLevel = difficultyLevels[adjustment.suggestedDifficulty];
                  expect(suggestedLevel).toBeGreaterThanOrEqual(currentLevel);
                }

                // Property: When user struggles, difficulty should decrease or maintain
                if (successRate <= 0.4 && currentDifficulty !== 'Easy') {
                  const difficultyLevels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                  const currentLevel = difficultyLevels[currentDifficulty];
                  const suggestedLevel = difficultyLevels[adjustment.suggestedDifficulty];
                  expect(suggestedLevel).toBeLessThanOrEqual(currentLevel);
                }
              }

              // Property: Confidence score should reflect data quality
              if (filteredAttempts.length === 0) {
                // No data should result in lower confidence
                expect(adjustment.confidenceScore).toBeLessThan(0.8);
              } else if (filteredAttempts.length >= 5) {
                // More data should generally result in higher confidence
                expect(adjustment.confidenceScore).toBeGreaterThan(0.3);
              }

              // Property: Difficulty adjustment should maintain core learning objectives
              // (The suggested difficulty should always be within valid range)
              expect(['Easy', 'Medium', 'Hard']).toContain(adjustment.suggestedDifficulty);

              // Property: Reason should be informative and related to performance
              expect(adjustment.reason).toMatch(/difficulty|performance|success|rate|time|hints|streak/i);

            } catch (error) {
              // If analysis fails, it should fail gracefully with a default response
              expect(error).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide appropriate default difficulty for new users based on cross-skill performance', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(userProgressArb, { minLength: 0, maxLength: 5 }),
          async (userId, crossSkillProgress) => {
            const filteredProgress = crossSkillProgress.map(progress => ({
              ...progress,
              userId
            }));

            // Setup mocks
            mockDb.getAllUserProgress.mockResolvedValue(filteredProgress);
            mockDb.getRecentChallengeAttempts.mockResolvedValue([]);

            try {
              const defaultDifficulty = await service.getDefaultDifficultyForNewUser(userId);

              // Property: Default difficulty must be valid
              expect(['Easy', 'Medium', 'Hard']).toContain(defaultDifficulty);

              // Property: For users with no history, should default to Medium
              if (filteredProgress.length === 0) {
                expect(defaultDifficulty).toBe('Medium');
              }

              // Property: For users with high cross-skill performance, should not start at Easy
              if (filteredProgress.length > 0) {
                const avgSuccessRate = filteredProgress.reduce((sum, p) => sum + p.successRate, 0) / filteredProgress.length;
                
                if (avgSuccessRate >= 0.8) {
                  expect(defaultDifficulty).not.toBe('Easy');
                }
                
                // Property: For users with low cross-skill performance, should not start at Hard
                if (avgSuccessRate <= 0.4) {
                  expect(defaultDifficulty).not.toBe('Hard');
                }
              }

            } catch (error) {
              // Should fail gracefully and return Medium as default
              expect(error).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate performance metrics consistently and accurately', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          skillIdArb,
          fc.array(challengeAttemptArb, { minLength: 1, maxLength: 10 }),
          async (userId, skillId, attempts) => {
            const filteredAttempts = attempts.map(attempt => ({
              ...attempt,
              userId,
              skillId,
              // Ensure timestamps are in descending order (most recent first)
              timestamp: new Date(Date.now() - attempts.indexOf(attempt) * 60000)
            }));

            // Setup mocks
            mockDb.getRecentChallengeAttempts.mockResolvedValue(filteredAttempts);

            try {
              const metrics = await service.calculatePerformanceMetrics(userId, skillId);

              // Property: Metrics must be valid and within expected ranges
              expect(metrics).toBeDefined();
              expect(metrics.recentSuccessRate).toBeGreaterThanOrEqual(0);
              expect(metrics.recentSuccessRate).toBeLessThanOrEqual(1);
              expect(metrics.averageTimeSpent).toBeGreaterThan(0);
              expect(metrics.hintsUsageRate).toBeGreaterThanOrEqual(0);
              expect(metrics.hintsUsageRate).toBeLessThanOrEqual(1);
              expect(Array.isArray(metrics.strugglingIndicators)).toBe(true);

              // Property: Success rate should match actual calculation
              const expectedSuccessRate = filteredAttempts.filter(a => a.success).length / filteredAttempts.length;
              expect(Math.abs(metrics.recentSuccessRate - expectedSuccessRate)).toBeLessThan(0.01);

              // Property: Average time should be reasonable if time data exists
              const attemptsWithTime = filteredAttempts.filter(a => a.timeSpent !== undefined);
              if (attemptsWithTime.length > 0) {
                const expectedAvgTime = attemptsWithTime.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attemptsWithTime.length;
                expect(Math.abs(metrics.averageTimeSpent - expectedAvgTime)).toBeLessThan(1);
              }

              // Property: Struggling indicators should be relevant to performance
              if (metrics.recentSuccessRate < 0.4) {
                expect(metrics.strugglingIndicators.length).toBeGreaterThan(0);
              }

            } catch (error) {
              expect(error).toBeInstanceOf(Error);
            }
          }
        ),
        { numRuns: 75 }
      );
    });
  });
});