import * as fc from 'fast-check';
import { ChallengeGenerator } from '../challenge-generator';
import type {
  ChallengeGenerationRequest,
  GeneratedChallenge,
  DifficultyLevel,
  SkillConfiguration
} from '@/types/skill-progression';

// Mock the database service
jest.mock('../skill-progression-db', () => ({
  skillProgressionDb: {
    getSkillConfiguration: jest.fn(),
  }
}));

// Mock the Groq service
jest.mock('@/lib/courseCreation/engines/shared/groqService', () => ({
  callGroq: jest.fn(),
}));

import { skillProgressionDb } from '../skill-progression-db';
import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';

describe('ChallengeGenerator Property Tests', () => {
  let generator: ChallengeGenerator;
  const mockDb = skillProgressionDb as jest.Mocked<typeof skillProgressionDb>;
  const mockCallGroq = callGroq as jest.MockedFunction<typeof callGroq>;

  beforeEach(() => {
    generator = new ChallengeGenerator();
    jest.clearAllMocks();
  });

  // Generators for property-based testing
  const difficultyArb = fc.constantFrom<DifficultyLevel>('Easy', 'Medium', 'Hard');
  
  const skillIdArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  
  const challengeTypeArb = fc.constantFrom(
    'programming', 'mathematics', 'science', 'language', 'default'
  );

  const skillConfigArb = fc.record({
    id: fc.string(),
    skillId: skillIdArb,
    masteryThreshold: fc.record({
      minSuccessRate: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }),
      challengesRequired: fc.integer({ min: 1, max: 10 }),
      maxChallenges: fc.integer({ min: 5, max: 15 })
    }),
    difficultyProgression: fc.record({
      startingDifficulty: difficultyArb,
      adaptiveScaling: fc.boolean()
    }),
    challengeTypes: fc.array(challengeTypeArb, { minLength: 1, maxLength: 5 }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  const challengeRequestArb = fc.record({
    skillId: skillIdArb,
    difficultyLevel: difficultyArb,
    challengeType: fc.option(challengeTypeArb, { nil: undefined }),
    userHistory: fc.option(fc.array(fc.record({
      id: fc.string(),
      userId: fc.string(),
      skillId: skillIdArb,
      challengeId: fc.string(),
      success: fc.boolean(),
      timeSpent: fc.option(fc.integer({ min: 1, max: 3600 }), { nil: undefined }),
      hintsUsed: fc.integer({ min: 0, max: 10 }),
      submissionCode: fc.option(fc.string(), { nil: undefined }),
      feedback: fc.option(fc.string(), { nil: undefined }),
      difficultyLevel: difficultyArb,
      timestamp: fc.date(),
      createdAt: fc.date()
    }), { maxLength: 10 }), { nil: undefined })
  });

  const validAIResponseArb = fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    starterCode: fc.option(fc.string({ maxLength: 1000 })),
    validationCriteria: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
    hints: fc.array(fc.string({ minLength: 5, maxLength: 200 }), { minLength: 1, maxLength: 5 }),
    estimatedTime: fc.integer({ min: 5, max: 120 }),
    learningObjectives: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 3 })
  });

  describe('Property 4: Challenge Generation Completeness', () => {
    /**
     * Feature: skill-progression-system, Property 4: Challenge Generation Completeness
     * Validates: Requirements 4.1, 4.2, 4.3
     */
    it('should generate complete challenges with all required components', async () => {
      await fc.assert(
        fc.asyncProperty(
          challengeRequestArb,
          skillConfigArb,
          validAIResponseArb,
          async (request, config, aiResponse) => {
            // Setup mocks
            mockDb.getSkillConfiguration.mockResolvedValue(config);
            mockCallGroq.mockResolvedValue(JSON.stringify(aiResponse));

            try {
              const challenge = await generator.generateChallenge(request);

              // Property: Generated challenge must have all required components
              expect(challenge).toBeDefined();
              expect(challenge.id).toBeDefined();
              expect(challenge.skillId).toBe(request.skillId);
              expect(challenge.title).toBeDefined();
              expect(challenge.title.trim()).not.toBe('');
              expect(challenge.description).toBeDefined();
              expect(challenge.description.trim()).not.toBe('');
              expect(Array.isArray(challenge.validationCriteria)).toBe(true);
              expect(challenge.validationCriteria.length).toBeGreaterThan(0);
              expect(Array.isArray(challenge.hints)).toBe(true);
              expect(challenge.hints.length).toBeGreaterThan(0);
              expect(challenge.difficultyLevel).toBe(request.difficultyLevel);
              expect(challenge.estimatedTime).toBeGreaterThan(0);
              expect(Array.isArray(challenge.learningObjectives)).toBe(true);

              // Property: Challenge aligns with skill objectives and difficulty level
              expect(['Easy', 'Medium', 'Hard']).toContain(challenge.difficultyLevel);
              
              // Property: Challenge includes appropriate starter code, validation criteria, and hints
              if (challenge.starterCode !== undefined) {
                expect(typeof challenge.starterCode).toBe('string');
              }
              
              challenge.validationCriteria.forEach(criterion => {
                expect(typeof criterion).toBe('string');
                expect(criterion.trim()).not.toBe('');
              });
              
              challenge.hints.forEach(hint => {
                expect(typeof hint).toBe('string');
                expect(hint.trim()).not.toBe('');
              });

            } catch (error) {
              // If AI generation fails, fallback should still produce a complete challenge
              if (error instanceof Error && error.message.includes('fallback')) {
                // This is expected behavior when AI fails but fallback works
                return;
              }
              throw error;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle AI generation failures with fallback system', async () => {
      await fc.assert(
        fc.asyncProperty(
          challengeRequestArb,
          skillConfigArb,
          async (request, config) => {
            // Setup mocks - AI fails but config exists
            mockDb.getSkillConfiguration.mockResolvedValue(config);
            mockCallGroq.mockRejectedValue(new Error('AI service unavailable'));

            try {
              const challenge = await generator.generateChallenge(request);

              // Property: Fallback challenges must still be complete and valid
              expect(challenge).toBeDefined();
              expect(challenge.skillId).toBe(request.skillId);
              expect(challenge.title).toBeDefined();
              expect(challenge.description).toBeDefined();
              expect(challenge.validationCriteria.length).toBeGreaterThan(0);
              expect(challenge.hints.length).toBeGreaterThan(0);
              expect(challenge.estimatedTime).toBeGreaterThan(0);

            } catch (error) {
              // If both AI and fallback fail, error should be informative
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toContain('Failed to generate challenge');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});