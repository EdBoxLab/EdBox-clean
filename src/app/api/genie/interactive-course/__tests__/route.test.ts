// ============================================
// Interactive Course Genie API Tests
// Integration tests for the enhanced Genie API
// ============================================

import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => ({
        data: { session: null }
      }))
    }
  }))
}));

// Mock AI providers
jest.mock('@/lib/ai-providers', () => ({
  generateWithRetry: jest.fn(() => Promise.resolve({
    text: 'This is a test response from Genie about the interactive course topic.'
  }))
}));

describe('/api/genie/interactive-course', () => {
  it('should handle basic interactive course request', async () => {
    const requestBody = {
      userMessage: 'Can you explain functions?',
      sessionId: 'test-session-123',
      learningContext: {
        currentConcepts: ['JavaScript', 'Functions'],
        masteredConcepts: ['Variables'],
        strugglingAreas: [],
        comprehensionLevel: 0.6
      }
    };

    const request = new NextRequest('http://localhost:3000/api/genie/interactive-course', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.response).toBeDefined();
    expect(data.responseType).toBeDefined();
    expect(data.nextAction).toBeDefined();
  });

  it('should return error for missing required fields', async () => {
    const requestBody = {
      // Missing userMessage and sessionId
      learningContext: {
        currentConcepts: ['JavaScript'],
        comprehensionLevel: 0.5
      }
    };

    const request = new NextRequest('http://localhost:3000/api/genie/interactive-course', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should analyze response for next action correctly', async () => {
    // Test the helper functions
    const { analyzeResponseForNextAction, determineResponseType } = require('../route');

    // Test assessment detection
    const assessmentResponse = 'Great! Now let me ask you a question to check your understanding.';
    const nextAction = analyzeResponseForNextAction(assessmentResponse, { comprehensionLevel: 0.6 });
    expect(nextAction).toBe('assess_understanding');

    // Test challenge detection
    const challengeResponse = 'Perfect! Now let\'s practice with a coding challenge.';
    const challengeAction = analyzeResponseForNextAction(challengeResponse, { comprehensionLevel: 0.7 });
    expect(challengeAction).toBe('deliver_challenge');

    // Test response type detection
    const encouragementResponse = 'Excellent work! You\'re doing great!';
    const responseType = determineResponseType(encouragementResponse);
    expect(responseType).toBe('encouragement');
  });
});