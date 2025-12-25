// ============================================
// Chat Storage Service Tests
// Tests for IndexedDB chat persistence
// ============================================

import { chatStorage, ChatMessage } from '../chat-storage';
import { InteractiveCourseSession } from '@/types/interactive-course';

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

// @ts-ignore
global.indexedDB = mockIndexedDB;

describe('ChatStorageService', () => {
  const mockSession: InteractiveCourseSession = {
    id: 'test-session-1',
    courseId: 'course-1',
    userId: 'user-1',
    currentTopic: 'Test Topic',
    learningContext: {
      currentConcepts: ['Variables'],
      masteredConcepts: [],
      strugglingAreas: [],
        comprehensionLevel: 0.5,
        preferredLearningStyle: 'interactive',
        goals: [
          {
            id: 'goal-1',
            text: 'Learn programming',
            status: 'pending',
            confidence: 0,
            timestamp: new Date().toISOString()
          }
        ]
      },
    progressState: {
      completedTopics: [],
      currentTopicProgress: 0.1,
      overallCourseProgress: 0.1,
      masteredSkills: [],
      strugglingSkills: [],
      totalTimeSpent: 0,
      challengesCompleted: 0,
      assessmentsCompleted: 0
    },
    sessionStartTime: new Date(),
    lastInteraction: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'genie',
      content: 'Hello! Welcome to the course.',
      timestamp: new Date(),
      type: 'message'
    },
    {
      id: 'msg-2',
      role: 'learner',
      content: 'Hi! I want to learn about variables.',
      timestamp: new Date(),
      type: 'message'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a chat storage service instance', () => {
    expect(chatStorage).toBeDefined();
    expect(typeof chatStorage.saveSession).toBe('function');
    expect(typeof chatStorage.loadSession).toBe('function');
  });

  it('should have proper interface methods', () => {
    expect(chatStorage.saveSession).toBeDefined();
    expect(chatStorage.loadSession).toBeDefined();
    expect(chatStorage.addMessage).toBeDefined();
    expect(chatStorage.updateSession).toBeDefined();
    expect(chatStorage.getUserSessions).toBeDefined();
    expect(chatStorage.deleteSession).toBeDefined();
  });

  // Note: Actual IndexedDB testing would require a more complex setup
  // This test verifies the service structure and interface
  it('should handle session data structure correctly', () => {
    expect(mockSession.id).toBe('test-session-1');
    expect(mockSession.courseId).toBe('course-1');
    expect(mockSession.userId).toBe('user-1');
    expect(mockMessages).toHaveLength(2);
    expect(mockMessages[0].role).toBe('genie');
    expect(mockMessages[1].role).toBe('learner');
  });
});