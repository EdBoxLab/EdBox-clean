import { sessionManager } from '@/lib/services/interactive-course-session-manager';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: jest.fn()
}));

describe('InteractiveCourseSessionManager Persistence', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    rpc: jest.fn()
  };

  beforeEach(() => {
    (createSupabaseBrowserClient as jest.Mock).mockReturnValue(mockSupabase);
    jest.clearAllMocks();
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

    mockSupabase.update.mockReturnValue({ error: null });

    // @ts-ignore
    await sessionManager.persistSession(mockSession);

    expect(mockSupabase.from).toHaveBeenCalledWith('interactive_course_sessions');
    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
      current_topic: 'React Hooks',
      learning_context: mockSession.learningContext,
      progress_state: mockSession.progressState
    }));
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'session-123');
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

    mockSupabase.single.mockResolvedValue({ data: dbSession, error: null });
    mockSupabase.update.mockReturnValue({ error: null });

    const session = await sessionManager.resumeSession('user-456', 'course-789');

    expect(session).toBeDefined();
    expect(session?.id).toBe('session-123');
    expect(session?.progressState.overallCourseProgress).toBe(20);
    expect(session?.learningContext.comprehensionLevel).toBe(0.8);
  });
});
