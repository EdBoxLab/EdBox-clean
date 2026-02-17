import { engineEvaluationService } from '../engine-evaluation';
import { generateWithFallback } from '../../ai-providers';

// Mock the AI providers service
jest.mock('../../ai-providers', () => ({
    generateWithFallback: jest.fn(),
}));

const mockGenerateWithFallback = generateWithFallback as jest.MockedFunction<typeof generateWithFallback>;

describe('EngineEvaluationService Migration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call generateWithFallback in generateTargetedHints', async () => {
        mockGenerateWithFallback.mockResolvedValue({
            text: JSON.stringify(['Hint 1', 'Hint 2']),
            provider: 'groq',
            success: true
        });

        const hints = await engineEvaluationService.generateTargetedHints({
            engine: 'Test Engine',
            challengeDescription: 'Test Description',
            submission: 'Test Submission',
            previousHints: [],
            difficultyLevel: 'Easy',
            specificIssues: ['Issue 1']
        });

        expect(mockGenerateWithFallback).toHaveBeenCalled();
        expect(hints).toEqual(['Hint 1', 'Hint 2']);
    });

    it('should call generateWithFallback and handle JSON response in processEvaluationResponse', async () => {
        const aiResponse = {
            success: false,
            score: 40,
            feedback: 'Incomplete implementation',
            detailedAnalysis: {
                strengths: ['Good structure'],
                weaknesses: ['Missing error handling']
            }
        };

        mockGenerateWithFallback.mockResolvedValueOnce({
            text: JSON.stringify(aiResponse),
            provider: 'groq',
            success: true
        });

        // Mock the second call (for targeted hints)
        mockGenerateWithFallback.mockResolvedValueOnce({
            text: JSON.stringify(['Add error handling']),
            provider: 'groq',
            success: true
        });

        // We need to access the private method or call a public method that uses it
        // evaluateSubmission uses processEvaluationResponse
        const result = await engineEvaluationService.evaluateSubmission({
            engine: 'Test Engine',
            challengeId: 'test-1',
            skillId: 'math-1',
            validationCriteria: ['must work'],
            submission: 'test code',
            difficultyLevel: 'Easy',
            timeSpent: 300,
            hintsUsed: 0
        });

        expect(mockGenerateWithFallback).toHaveBeenCalledTimes(2);
        expect(result.success).toBe(false);
        expect(result.score).toBe(40);
        expect(result.hints).toEqual(['Add error handling']);
    });
});
