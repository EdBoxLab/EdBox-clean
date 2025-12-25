// ============================================
// Understanding Assessment Service Tests
// Tests for question generation, response evaluation, and comprehension analysis
// ============================================

import { UnderstandingAssessment } from '../understanding-assessment';
import { LearningContext, ComprehensionResult, DifficultyLevel } from '@/types/interactive-course';

describe('UnderstandingAssessment', () => {
  let assessmentService: UnderstandingAssessment;
  let mockContext: LearningContext;

  beforeEach(() => {
    assessmentService = new UnderstandingAssessment();
    mockContext = {
      currentConcepts: ['Functions', 'Variables'],
      masteredConcepts: ['Basic Syntax'],
      strugglingAreas: ['Loops'],
        comprehensionLevel: 0.6,
        preferredLearningStyle: 'visual',
        goals: [
          {
            id: 'goal-1',
            text: 'Learn programming fundamentals',
            status: 'pending',
            confidence: 0,
            timestamp: new Date().toISOString()
          }
        ]
      };
  });

  describe('createQuickCheck', () => {
    it('should create a quick check question for given concept and difficulty', async () => {
      const result = await assessmentService.createQuickCheck('Functions', 'Medium');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('correctAnswer');
      expect(result).toHaveProperty('explanation');
      expect(result.concept).toBe('Functions');
      expect(result.difficulty).toBe('Medium');
      expect(result.question).toContain('Functions');
    });

    it('should generate different question types based on difficulty', async () => {
      const easyQuestion = await assessmentService.createQuickCheck('Variables', 'Easy');
      const hardQuestion = await assessmentService.createQuickCheck('Variables', 'Hard');

      expect(easyQuestion.type).toMatch(/multiple_choice|true_false/);
      expect(hardQuestion.type).toMatch(/multiple_choice|short_answer/);
    });
  });

  describe('evaluateResponse', () => {
    it('should evaluate correct responses positively', async () => {
      const questionId = 'test_functions_123';
      const goodResponse = 'Functions are reusable blocks of code that help organize and structure programs efficiently';

      const result = await assessmentService.evaluateResponse(questionId, goodResponse);

      expect(result.correct).toBe(true);
      expect(result.confidenceLevel).toBeGreaterThan(0.5);
      expect(result.conceptMastery).toBeGreaterThan(0.4);
      expect(result.suggestedAction).toMatch(/proceed|challenge|practice/);
      expect(result.feedback).toContain('understanding');
    });

    it('should evaluate poor responses appropriately', async () => {
      const questionId = 'test_functions_123';
      const poorResponse = 'I dont know';

      const result = await assessmentService.evaluateResponse(questionId, poorResponse);

      expect(result.correct).toBe(false);
      expect(result.confidenceLevel).toBeLessThan(0.5);
      expect(result.conceptMastery).toBeLessThan(0.5);
      expect(result.suggestedAction).toMatch(/review|practice/);
      expect(result.feedback).toContain('revisit');
    });
  });

  describe('generateAdaptiveQuestions', () => {
    it('should generate questions for current concepts', async () => {
      const questions = await assessmentService.generateAdaptiveQuestions(mockContext);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.some(q => q.concept === 'Functions')).toBe(true);
      expect(questions.some(q => q.concept === 'Variables')).toBe(true);
    });

    it('should generate synthesis questions for multiple mastered concepts', async () => {
      const contextWithMastery = {
        ...mockContext,
        masteredConcepts: ['Variables', 'Functions', 'Arrays']
      };

      const questions = await assessmentService.generateAdaptiveQuestions(contextWithMastery);
      const synthesisQuestion = questions.find(q => q.concept.includes('Synthesis'));

      expect(synthesisQuestion).toBeDefined();
      expect(synthesisQuestion?.difficulty).toBe('Hard');
    });

    it('should generate remediation questions for struggling areas', async () => {
      const questions = await assessmentService.generateAdaptiveQuestions(mockContext);
      const remediationQuestion = questions.find(q => q.concept === 'Loops');

      expect(remediationQuestion).toBeDefined();
      expect(remediationQuestion?.difficulty).toBe('Easy');
    });
  });

  describe('evaluateComprehensionLevel', () => {
    it('should calculate comprehension level from assessment results', async () => {
      const results: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.8, conceptMastery: 0.7, suggestedAction: 'proceed', feedback: 'Good' },
        { correct: true, confidenceLevel: 0.9, conceptMastery: 0.8, suggestedAction: 'challenge', feedback: 'Excellent' },
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'review', feedback: 'Needs work' }
      ];

      const comprehensionLevel = await assessmentService.evaluateComprehensionLevel(results, mockContext);

      expect(comprehensionLevel).toBeGreaterThan(0);
      expect(comprehensionLevel).toBeLessThanOrEqual(1);
      expect(comprehensionLevel).toBeCloseTo(0.66, 1); // Approximately 2/3 correct
    });

    it('should return current level when no results provided', async () => {
      const comprehensionLevel = await assessmentService.evaluateComprehensionLevel([], mockContext);

      expect(comprehensionLevel).toBe(mockContext.comprehensionLevel);
    });
  });

  describe('determineNextLearningAction', () => {
    it('should suggest challenge for high performance', () => {
      const highPerformanceResults: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.9, conceptMastery: 0.8, suggestedAction: 'proceed', feedback: 'Excellent' },
        { correct: true, confidenceLevel: 0.8, conceptMastery: 0.9, suggestedAction: 'proceed', feedback: 'Great' }
      ];

      const highMasteryContext = { ...mockContext, comprehensionLevel: 0.8 };
      const action = assessmentService.determineNextLearningAction(highPerformanceResults, highMasteryContext);

      expect(action).toBe('challenge');
    });

    it('should suggest review for poor performance', () => {
      const poorPerformanceResults: ComprehensionResult[] = [
        { correct: false, confidenceLevel: 0.3, conceptMastery: 0.2, suggestedAction: 'review', feedback: 'Needs work' },
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'review', feedback: 'Try again' }
      ];

      const strugglingContext = { ...mockContext, strugglingAreas: ['Functions', 'Variables'] };
      const action = assessmentService.determineNextLearningAction(poorPerformanceResults, strugglingContext);

      expect(action).toBe('review');
    });

    it('should suggest practice for moderate performance', () => {
      const moderateResults: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.6, conceptMastery: 0.5, suggestedAction: 'practice', feedback: 'Good start' },
        { correct: false, confidenceLevel: 0.5, conceptMastery: 0.4, suggestedAction: 'practice', feedback: 'Keep trying' }
      ];

      const action = assessmentService.determineNextLearningAction(moderateResults, mockContext);

      expect(action).toMatch(/practice|review/);
    });
  });
});