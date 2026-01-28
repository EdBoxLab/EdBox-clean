import { createClient } from '@supabase/supabase-js';
import { LearningSession, LearningLoopIteration, UnderstandingAssessment } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const SessionManager = {
  async getOrCreateSession(userId: string, courseId: string): Promise<LearningSession> {
    const { data, error } = await supabase
      .from('interactive_course_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (data) return data;

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('interactive_course_sessions')
      .insert({
        user_id: userId,
        course_id: courseId,
        is_active: true,
        learning_context: {},
        progress_state: {}
      })
      .select()
      .single();

    if (createError) throw createError;
    return newSession;
  },

  async updateCurrentTopic(sessionId: string, topic: string) {
    const { error } = await supabase
      .from('interactive_course_sessions')
      .update({ 
        current_topic: topic,
        last_interaction: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async startIteration(sessionId: string, iterationNumber: number, concept: string): Promise<LearningLoopIteration> {
    const { data, error } = await supabase
      .from('learning_loop_iterations')
      .insert({
        session_id: sessionId,
        iteration_number: iterationNumber,
        concept: concept
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeIterationStep(iterationId: string, step: 'explanation' | 'assessment' | 'challenge' | 'evaluation') {
    const update: any = { completed_at: new Date().toISOString() };
    if (step === 'explanation') update.explanation_completed = true;
    if (step === 'assessment') update.assessment_completed = true;
    if (step === 'challenge') update.challenge_completed = true;
    if (step === 'evaluation') update.evaluation_completed = true;

    const { error } = await supabase
      .from('learning_loop_iterations')
      .update(update)
      .eq('id', iterationId);

    if (error) throw error;
  },

  async incrementSessionRetry(sessionId: string) {
    const { data: session } = await supabase
      .from('interactive_course_sessions')
      .select('retry_count')
      .eq('id', sessionId)
      .single();

    const { error } = await supabase
      .from('interactive_course_sessions')
      .update({ retry_count: (session?.retry_count || 0) + 1 })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async updateCurrentNode(sessionId: string, nodeId: string) {
    const { error } = await supabase
      .from('interactive_course_sessions')
      .update({ 
        current_topic: nodeId,
        last_interaction: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async logResponse(sessionId: string, nodeId: string, userMessage: string, reasoning: any, feedback: string) {
    const { data: session } = await supabase
      .from('interactive_course_sessions')
      .select('progress_state')
      .eq('id', sessionId)
      .single();

    const history = session?.progress_state?.history || [];
    
    // Optimization: Cap history length to prevent document size bloat (Musk-tier efficiency)
    const updatedHistory = [
      ...history.slice(-19), // Keep last 19 entries
      {
        timestamp: new Date().toISOString(),
        nodeId,
        userMessage,
        reasoning,
        feedback
      }
    ];

    const { error } = await supabase
      .from('interactive_course_sessions')
      .update({ 
        progress_state: { ...session?.progress_state, history: updatedHistory },
        last_interaction: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async logAssessment(assessment: Partial<UnderstandingAssessment>): Promise<UnderstandingAssessment> {
    const { data, error } = await supabase
      .from('understanding_assessments')
      .insert({
        ...assessment,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
