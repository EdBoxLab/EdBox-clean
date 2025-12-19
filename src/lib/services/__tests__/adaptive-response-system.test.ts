// ============================================
// Adaptive Response System Tests
// Tests for adaptive responses and learning path adaptation
// ============================================

import { AdaptiveResponseSystem } from '../adaptive-response-system';
import { LearningContext, ComprehensionResult } from '@/types/interactive-course';

describe('AdaptiveResponseSystem', () => {
  let adaptiveSystem: AdaptiveResponseSystem;
  let mockContext: LearningContext;

  beforeEach(() => {
    adaptiveSystem = new AdaptiveResponseSystem();
    mockContext = {
      currentConcepts: ['Functions'],
      masteredConcepts: ['Variables'],
      strugglingAreas: ['Loops'],
      comprehensionLevel: 0.6,
      preferredLearningStyle: 'hands-on'
    };
  });

  describe('generateAdaptiveResponse', () => {
    it('should generate review response for poor comprehension', async () => {
      const poorResults: ComprehensionResult[] = [
        { correct: false, confidenceLevel: 0.3, conceptMastery: 0.2, suggestedAction: 'review', feedback: 'Needs work' }
      ];

      const response = await adaptiveSystem.generateAdaptiveResponse(poorResults, mockContext, 'Functions');

      expect(response.responseType).toBe('explanation');
      expect(response.nextAction).toBe('continue_explanation');
      expect(response.content).toContain('revisit');
      expect(response.metadata?.adaptiveAction).toBe('review');
    });

    it('should generate challenge response for high comprehension', async () => {
      const excellentResults: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.9, conceptMastery: 0.8, suggestedAction: 'challenge', feedback: 'Excellent' },
        { correct: true, confidenceLevel: 0.8, conceptMastery: 0.9, suggestedAction: 'challenge', feedback: 'Outstanding' }
      ];

      const highMasteryContext = { ...mockContext, comprehensionLevel: 0.8 };
      const response = await adaptiveSystem.generateAdaptiveResponse(excellentResults, highMasteryContext, 'Functions');

      expect(response.responseType).toBe('challenge_intro');
      expect(response.nextAction).toBe('deliver_challenge');
      expect(response.content).toContain('mastered');
      expect(response.metadata?.adaptiveAction).toBe('challenge');
    });

    it('should generate practice response for moderate comprehension', async () => {
      const moderateResults: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.6, conceptMastery: 0.5, suggestedAction: 'practice', feedback: 'Good progress' },
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'practice', feedback: 'Keep trying' }
      ];

      // Use context without struggling areas to get practice action (accuracy = 50%, which should trigger practice)
      const practiceContext = { ...mockContext, strugglingAreas: [] };
      const response = await adaptiveSystem.generateAdaptiveResponse(moderateResults, practiceContext, 'Functions');

      expect(response.responseType).toMatch(/encouragement|explanation/);
      expect(response.nextAction).toMatch(/assess_understanding|continue_explanation/);
      expect(response.content).toContain('practice');
      expect(response.metadata?.adaptiveAction).toBe('practice');
    });

    it('should generate proceed response for good comprehension', async () => {
      const goodResults: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.7, conceptMastery: 0.7, suggestedAction: 'proceed', feedback: 'Well done' }
      ];

      // Use context without struggling areas to get proceed action
      const proceedContext = { ...mockContext, strugglingAreas: [] };
      const response = await adaptiveSystem.generateAdaptiveResponse(goodResults, proceedContext, 'Functions');

      expect(response.responseType).toMatch(/encouragement|explanation/);
      expect(response.nextAction).toMatch(/move_to_next_topic|continue_explanation/);
      expect(response.content).toContain('Excellent work');
      expect(response.metadata?.adaptiveAction).toBe('proceed');
    });
  });

  describe('createRemediationPathway', () => {
    it('should create appropriate remediation for struggling learners', async () => {
      const strugglingContext = {
        ...mockContext,
        comprehensionLevel: 0.2,
        strugglingAreas: ['Functions', 'Variables', 'Loops']
      };

      const pathway = await adaptiveSystem.createRemediationPathway('Functions', strugglingContext, strugglingContext.strugglingAreas);

      expect(pathway.explanation).toContain('basics');
      expect(pathway.exercises[0]).toContain('Simple identification exercises');
      expect(pathway.nextSteps[0]).toContain('fundamental');
    });

    it('should create targeted remediation for specific issues', async () => {
      const targetedContext = {
        ...mockContext,
        comprehensionLevel: 0.5,
        strugglingAreas: ['Functions']
      };

      const pathway = await adaptiveSystem.createRemediationPathway('Functions', targetedContext, ['Functions']);

      expect(pathway.explanation).toContain('specific aspects');
      expect(pathway.exercises[0]).toContain('Focused exercises');
      expect(pathway.nextSteps[0]).toContain('specific');
    });
  });

  describe('createAdvancementPathway', () => {
    it('should create advancement pathway for high performers', async () => {
      const advancedContext = {
        ...mockContext,
        comprehensionLevel: 0.8,
        masteredConcepts: ['Variables', 'Functions', 'Arrays']
      };

      const pathway = await adaptiveSystem.createAdvancementPathway('Functions', advancedContext, advancedContext.masteredConcepts);

      expect(pathway.advancedTopics).toContain('Advanced applications of Functions');
      expect(pathway.challenges[0]).toContain('Real-world project');
      expect(pathway.connections.length).toBeGreaterThan(0);
    });
  });

  describe('adaptLearningPath', () => {
    it('should adapt path based on performance patterns', async () => {
      const improvingHistory: ComprehensionResult[] = [
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'review', feedback: 'Keep trying' },
        { correct: true, confidenceLevel: 0.6, conceptMastery: 0.5, suggestedAction: 'practice', feedback: 'Better' },
        { correct: true, confidenceLevel: 0.8, conceptMastery: 0.7, suggestedAction: 'proceed', feedback: 'Great!' }
      ];

      const adaptedPath = await adaptiveSystem.adaptLearningPath(improvingHistory, mockContext);

      expect(adaptedPath.recommendedPath).toContain('Functions');
      expect(adaptedPath.difficultyAdjustment).toMatch(/Medium|Hard/);
      expect(adaptedPath.focusAreas.length).toBeGreaterThanOrEqual(0);
    });

    it('should recommend easier path for declining performance', async () => {
      const decliningHistory: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.7, conceptMastery: 0.6, suggestedAction: 'proceed', feedback: 'Good' },
        { correct: false, confidenceLevel: 0.5, conceptMastery: 0.4, suggestedAction: 'practice', feedback: 'Try again' },
        { correct: false, confidenceLevel: 0.3, conceptMastery: 0.2, suggestedAction: 'review', feedback: 'Needs work' }
      ];

      const lowContext = { ...mockContext, comprehensionLevel: 0.3 };
      const adaptedPath = await adaptiveSystem.adaptLearningPath(decliningHistory, lowContext);

      expect(adaptedPath.difficultyAdjustment).toBe('Easy');
      expect(adaptedPath.focusAreas).toContain('Fundamental Strengthening');
    });
  });

  describe('generatePersonalizedRecommendations', () => {
    it('should generate appropriate recommendations based on performance', async () => {
      const mixedPerformance: ComprehensionResult[] = [
        { correct: true, confidenceLevel: 0.8, conceptMastery: 0.7, suggestedAction: 'proceed', feedback: 'Good' },
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'review', feedback: 'Needs work' }
      ];

      const recommendations = await adaptiveSystem.generatePersonalizedRecommendations(mockContext, mixedPerformance);

      expect(recommendations.studyTips.length).toBeGreaterThan(0);
      expect(recommendations.practiceAreas.length).toBeGreaterThan(0);
      expect(recommendations.strengthAreas.length).toBeGreaterThan(0);
      expect(recommendations.timeAllocation).toHaveProperty('Current Concepts');
      
      // Verify time allocation adds up to 100%
      const totalTime = Object.values(recommendations.timeAllocation).reduce((sum, time) => sum + time, 0);
      expect(totalTime).toBe(100);
    });

    it('should prioritize struggling areas when many weaknesses exist', async () => {
      const poorPerformance: ComprehensionResult[] = [
        { correct: false, confidenceLevel: 0.3, conceptMastery: 0.2, suggestedAction: 'review', feedback: 'Needs work' },
        { correct: false, confidenceLevel: 0.4, conceptMastery: 0.3, suggestedAction: 'review', feedback: 'Try again' }
      ];

      const strugglingContext = {
        ...mockContext,
        strugglingAreas: ['Functions', 'Variables', 'Loops'],
        comprehensionLevel: 0.3
      };

      const recommendations = await adaptiveSystem.generatePersonalizedRecommendations(strugglingContext, poorPerformance);

      expect(recommendations.timeAllocation['Struggling Areas']).toBeGreaterThanOrEqual(40);
      expect(recommendations.studyTips).toContain('Focus on one concept at a time to avoid overwhelm');
    });
  });
});