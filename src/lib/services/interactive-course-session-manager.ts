// ============================================
// Interactive Course Session Manager
// Handles session lifecycle: create, resume, persist
// ============================================

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import {
  InteractiveCourseSession,
  ConversationMessage,
  SessionManager,
  SessionCreationOptions,
  SessionResumeData,
  LearningContext,
  CourseProgressState,
  SessionError,
  UnderstandingAssessment,
  LearningLoopIteration
} from '@/types/interactive-course';

/**
 * Session manager implementation for interactive course experience
 */
export class InteractiveCourseSessionManager implements SessionManager {
  private supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? createSupabaseBrowserClient()
    : null as any;
  
  private adminSupabase = null as any;

  constructor(useAdmin = false) {
    if (useAdmin || typeof window === 'undefined') {
      try {
        this.adminSupabase = createServerSupabaseClient();
      } catch (e) {
        console.warn('[SessionManager] Failed to create admin client, falling back to browser client');
      }
    }
  }

  private getClient() {
    return this.adminSupabase || this.supabase;
  }

  /**
   * Create a new interactive course session
   */
  async createSession(courseId: string, userId: string): Promise<InteractiveCourseSession> {
    try {
      // Check if there's already an active session for this user/course
      const existingSession = await this.resumeSession(userId, courseId);
      if (existingSession) {
        return existingSession;
      }

      // Create new session using database function
      const { data, error } = await this.getClient()
        .rpc('create_or_resume_session', {
          p_user_id: userId,
          p_course_id: courseId
        });

      if (error) {
        throw new SessionError(`Failed to create session: ${error.message}`, undefined, userId);
      }

      // Fetch the created session
      const { data: sessionData, error: fetchError } = await this.getClient()
        .from('interactive_course_sessions')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError || !sessionData) {
        throw new SessionError(`Failed to fetch created session: ${fetchError?.message}`, data, userId);
      }

      return this.mapDatabaseSessionToInterface(sessionData);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error creating session: ${error}`, undefined, userId);
    }
  }

  /**
   * Resume an existing active session or return null if none exists
   */
  async resumeSession(userId: string, courseId: string): Promise<InteractiveCourseSession | null> {
    try {
      const { data, error } = await this.getClient()
        .from('interactive_course_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active session found
          return null;
        }
        throw new SessionError(`Failed to resume session: ${error.message}`, undefined, userId);
      }

      // Update last interaction timestamp
      await this.getClient()
        .from('interactive_course_sessions')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', data.id);

      return this.mapDatabaseSessionToInterface(data);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error resuming session: ${error}`, undefined, userId);
    }
  }

  /**
   * Persist session state to database
   */
  async persistSession(session: InteractiveCourseSession): Promise<void> {
    try {
      const { error } = await this.getClient()
        .from('interactive_course_sessions')
        .update({
          current_topic: session.currentTopic,
          learning_context: session.learningContext,
          progress_state: session.progressState,
          last_interaction: session.lastInteraction.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) {
        throw new SessionError(`Failed to persist session: ${error.message}`, session.id, session.userId);
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error persisting session: ${error}`, session.id, session.userId);
    }
  }

  /**
   * End an active session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const { data, error } = await this.getClient()
        .rpc('end_session', { p_session_id: sessionId });

      if (error) {
        throw new SessionError(`Failed to end session: ${error.message}`, sessionId);
      }

      if (!data) {
        throw new SessionError(`Session not found or already ended`, sessionId);
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error ending session: ${error}`, sessionId);
    }
  }

  /**
   * Get conversation history for a session
   */
  async getSessionHistory(sessionId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await this.getClient()
        .rpc('get_session_conversation', {
          p_session_id: sessionId,
          p_limit: limit
        });

      if (error) {
        throw new SessionError(`Failed to get session history: ${error.message}`, sessionId);
      }

      return (data || []).map(this.mapDatabaseMessageToInterface).reverse(); // Reverse to get chronological order
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error getting session history: ${error}`, sessionId);
    }
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(
    sessionId: string,
    role: 'genie' | 'learner',
    content: string,
    messageType: 'explanation' | 'question' | 'assessment' | 'challenge' | 'feedback' | 'encouragement',
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const { data, error } = await this.getClient()
        .rpc('add_conversation_message', {
          p_session_id: sessionId,
          p_role: role,
          p_content: content,
          p_message_type: messageType,
          p_metadata: metadata || {}
        });

      if (error) {
        throw new SessionError(`Failed to add message: ${error.message}`, sessionId);
      }

      return data;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error adding message: ${error}`, sessionId);
    }
  }

  /**
   * Get complete session resume data including recent messages and pending items
   */
  async getSessionResumeData(sessionId: string): Promise<SessionResumeData> {
    try {
      // Get session data
      const { data: sessionData, error: sessionError } = await this.getClient()
        .from('interactive_course_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw new SessionError(`Failed to get session data: ${sessionError?.message}`, sessionId);
      }

      // Get recent messages
      const recentMessages = await this.getSessionHistory(sessionId, 20);

      // Get current learning loop iteration
      const { data: iterationData } = await this.getClient()
        .from('learning_loop_iterations')
        .select('*')
        .eq('session_id', sessionId)
        .is('completed_at', null)
        .order('iteration_number', { ascending: false })
        .limit(1)
        .single();

      // Get pending assessments
      const { data: assessmentData } = await this.getClient()
        .from('understanding_assessments')
        .select('*')
        .eq('session_id', sessionId)
        .is('answered_at', null)
        .order('created_at', { ascending: false });

      return {
        session: this.mapDatabaseSessionToInterface(sessionData),
        recentMessages,
        currentIteration: iterationData ? this.mapDatabaseIterationToInterface(iterationData) : undefined,
        pendingAssessments: (assessmentData || []).map(this.mapDatabaseAssessmentToInterface)
      };
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError(`Unexpected error getting session resume data: ${error}`, sessionId);
    }
  }

  /**
   * Map database session record to interface
   */
  private mapDatabaseSessionToInterface(data: any): InteractiveCourseSession {
    return {
      id: data.id,
      courseId: data.course_id,
      userId: data.user_id,
      currentTopic: data.current_topic,
      learningContext: data.learning_context || this.getDefaultLearningContext(),
      progressState: data.progress_state || this.getDefaultProgressState(),
      sessionStartTime: new Date(data.session_start_time),
      lastInteraction: new Date(data.last_interaction),
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database message record to interface
   */
  private mapDatabaseMessageToInterface(data: any): ConversationMessage {
    return {
      id: data.message_id,
      sessionId: data.session_id || '', // Will be filled by the RPC function context
      role: data.role,
      content: data.content,
      messageType: data.message_type,
      metadata: data.metadata,
      timestamp: new Date(data.timestamp),
      createdAt: new Date(data.timestamp) // Using timestamp as created_at for RPC results
    };
  }

  /**
   * Map database assessment record to interface
   */
  private mapDatabaseAssessmentToInterface(data: any): UnderstandingAssessment {
    return {
      id: data.id,
      sessionId: data.session_id,
      concept: data.concept,
      questionType: data.question_type,
      questionData: data.question_data,
      learnerResponse: data.learner_response,
      isCorrect: data.is_correct,
      comprehensionLevel: data.comprehension_level,
      feedback: data.feedback,
      createdAt: new Date(data.created_at),
      answeredAt: data.answered_at ? new Date(data.answered_at) : undefined
    };
  }

  /**
   * Map database iteration record to interface
   */
  private mapDatabaseIterationToInterface(data: any): LearningLoopIteration {
    return {
      id: data.id,
      sessionId: data.session_id,
      iterationNumber: data.iteration_number,
      concept: data.concept,
      explanationCompleted: data.explanation_completed,
      assessmentCompleted: data.assessment_completed,
      challengeCompleted: data.challenge_completed,
      evaluationCompleted: data.evaluation_completed,
      masteryAchieved: data.mastery_achieved,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Get default learning context for new sessions
   */
  private getDefaultLearningContext(): LearningContext {
    return {
      currentConcepts: [],
      masteredConcepts: [],
      strugglingAreas: [],
      comprehensionLevel: 0.5 // Start at neutral
    };
  }

  /**
   * Get default progress state for new sessions
   */
  private getDefaultProgressState(): CourseProgressState {
    return {
      completedTopics: [],
      currentTopicProgress: 0,
      overallCourseProgress: 0,
      masteredSkills: [],
      strugglingSkills: [],
      totalTimeSpent: 0,
      challengesCompleted: 0,
      assessmentsCompleted: 0
    };
  }
}

/**
 * Singleton instance of the session manager
 */
export const sessionManager = new InteractiveCourseSessionManager();