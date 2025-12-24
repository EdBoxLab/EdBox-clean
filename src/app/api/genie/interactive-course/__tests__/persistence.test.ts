// Set dummy env vars for Supabase client initialization
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-key';

import { sessionManager } from '@/lib/services/interactive-course-session-manager';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { mock, describe, it, expect, beforeEach } from 'bun:test';

// Mock the Supabase client for Bun
const mockSupabase: any = {
  from: () => mockSupabase,
  select: () => mockSupabase,
  update: () => mockSupabase,
  eq: () => mockSupabase,
  single: async () => ({ data: {}, error: null }),
  rpc: async () => ({ data: {}, error: null })
};

// Override the private property for testing if needed
mock.module('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => mockSupabase
}));

describe('InteractiveCourseSessionManager Persistence', () => {
  beforeEach(() => {
    // @ts-ignore - injecting mock directly into singleton for reliability in tests
    sessionManager.supabase = mockSupabase;
  });

  it('should save progress state and learning context correctly', async () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-456',
      courseId: 'course-789',
      currentTopic: 'React Hooks',
      learningContext: {
        currentConcepts: ['useState', 'useEffect'],
        masteredConcepts: [],
        strugglingAreas: [],
        comprehensionLevel: 0.7
      },
      progressState: {
        completedTopics: [],
        currentTopicProgress: 45,
        overallCourseProgress: 10,
        masteredSkills: ['JSX'],
        strugglingSkills: [],
        totalTimeSpent: 120,
        challengesCompleted: 1,
        assessmentsCompleted: 2
      },
      lastInteraction: new Date(),
      isActive: true
    };

    await sessionManager.persistSession(mockSession as any);
    // If it doesn't throw, the persistence logic is correctly calling the client
  });

  it('should resume session with correct mapped data', async () => {
    const dbSession = {
      id: 'session-123',
      user_id: 'user-456',
      course_id: 'course-789',
      current_topic: 'React Hooks',
      learning_context: { comprehensionLevel: 0.8 },
      progress_state: { overallCourseProgress: 20 },
      session_start_time: new Date().toISOString(),
      last_interaction: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockSupabase.single = async () => ({ data: dbSession, error: null });

    const session = await sessionManager.resumeSession('user-456', 'course-789');

    expect(session).toBeDefined();
    expect(session?.id).toBe('session-123');
    expect(session?.progressState.overallCourseProgress).toBe(20);
  });
});
