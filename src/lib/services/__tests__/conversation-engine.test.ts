// ============================================
// Conversation Engine Tests
// Unit tests for the interactive course conversation engine
// ============================================

import { InteractiveCourseConversationEngine } from '../conversation-engine';
import { LearningContext, DifficultyLevel } from '@/types/interactive-course';

// Mock the session manager
jest.mock('../interactive-course-session-manager', () => ({
  sessionManager: {
    createSession: jest.fn(),
    addMessage: jest.fn(),
    getSessionResumeData: jest.fn(),
    getSessionHistory: jest.fn(),
    persistSession: jest.fn(),
    endSession: jest.fn()
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('InteractiveCourseConversationEngine', () => {
  let engine: InteractiveCourseConversationEngine;
  let mockContext: LearningContext;

  beforeEach(() => {
    engine = new InteractiveCourseConversationEngine();
    mockContext = {
      currentConcepts: ['JavaScript', 'Functions'],
      masteredConcepts: ['Variables', 'Data Types'],
      strugglingAreas: [],
      comprehensionLevel: 0.7,
      preferredLearningStyle: 'visual'
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('generateExplanation', () => {
    it('should generate explanation using Genie API', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Here\'s how functions work in JavaScript...',
          responseType: 'explanation',
          nextAction: 'assess_understanding'
        })
      });

      const result = await engine.generateExplanation('Functions', mockContext);

      expect(result).toBe('Here\'s how functions work in JavaScript...');
      expect(global.fetch).toHaveBeenCalledWith('/api/genie/interactive-course', expect.any(Object));
    });

    it('should fallback to template explanation when API fails', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await engine.generateExplanation('Functions', mockContext);

      expect(result).toContain('Functions');
      expect(result).toContain('understanding');
    });
  });

  describe('createAssessmentQuestion', () => {
    it('should create assessment question for given concept', async () => {
      const result = await engine.createAssessmentQuestion('Functions', 'Medium');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('concept', 'Functions');
      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('type', 'short_answer');
      expect(result).toHaveProperty('difficulty', 'Medium');
      expect(result).toHaveProperty('rubric');
    });
  });

  describe('private helper methods', () => {
    it('should calculate engagement score correctly', () => {
      const engine = new InteractiveCourseConversationEngine();
      
      // Access private method through any cast for testing
      const calculateEngagementScore = (engine as any).calculateEngagementScore;
      
      // High engagement input
      const highEngagement = calculateEngagementScore('This is really interesting! I have a question about it.');
      expect(highEngagement).toBeGreaterThan(0.7);
      
      // Low engagement input
      const lowEngagement = calculateEngagementScore('ok');
      expect(lowEngagement).toBeLessThan(0.5);
    });

    it('should extract concepts from response correctly', () => {
      const engine = new InteractiveCourseConversationEngine();
      
      // Access private method through any cast for testing
      const extractConcepts = (engine as any).extractConceptsFromResponse;
      
      const response = 'This function uses an algorithm to process the array data.';
      const concepts = extractConcepts(response);
      
      expect(concepts).toContain('function');
      expect(concepts).toContain('algorithm');
      expect(concepts).toContain('array');
    });

    it('should determine difficulty level based on content and context', () => {
      const engine = new InteractiveCourseConversationEngine();
      
      // Access private method through any cast for testing
      const determineDifficultyLevel = (engine as any).determineDifficultyLevel;
      
      // Advanced content
      const hardLevel = determineDifficultyLevel('This advanced algorithm is complex', mockContext);
      expect(hardLevel).toBe('Hard');
      
      // Basic content
      const easyLevel = determineDifficultyLevel('This is a simple, basic concept', mockContext);
      expect(easyLevel).toBe('Easy');
    });
  });

  describe('content transformation', () => {
    it('should transform basic content appropriately', () => {
      const engine = new InteractiveCourseConversationEngine();
      
      // Access private method through any cast for testing
      const basicTransformation = (engine as any).basicContentTransformation;
      
      const content = 'Functions are reusable blocks of code.';
      const result = basicTransformation(content, mockContext);
      
      expect(result).toContain(content);
      expect(result).toContain('learned'); // Should reference previous learning
    });

    it('should integrate multimedia elements in fallback', () => {
      const engine = new InteractiveCourseConversationEngine();
      
      // Access private method through any cast for testing
      const multimediaIntegration = (engine as any).basicMultimediaIntegration;
      
      const content = 'Functions work like this.';
      const multimedia = ['video-demo', 'interactive-example'];
      const result = multimediaIntegration(content, multimedia, mockContext);
      
      expect(result).toContain(content);
      expect(result).toContain('video'); // Should reference multimedia
    });
  });
});