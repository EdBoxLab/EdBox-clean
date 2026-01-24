import { createClient } from '@supabase/supabase-js';
import { LearningSession } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const SessionManager = {
  async getOrCreateSession(userId: string, courseId: string): Promise<LearningSession> {
    const { data, error } = await supabase
      .from('genie_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (data) return data;

    // Create new session
    const { data: newSession, error: createError } = await supabase
      .from('genie_sessions')
      .insert({
        user_id: userId,
        course_id: courseId,
        is_active: true
      })
      .select()
      .single();

    if (createError) throw createError;
    return newSession;
  },

  async updateCurrentNode(sessionId: string, nodeId: string) {
    const { error } = await supabase
      .from('genie_sessions')
      .update({ current_node_id: nodeId })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async logResponse(sessionId: string, nodeId: string, userResponse: string, evaluation: any, feedback: string) {
    const { error } = await supabase
      .from('genie_responses')
      .insert({
        session_id: sessionId,
        node_id: nodeId,
        user_response: userResponse,
        ai_evaluation: evaluation,
        feedback: feedback
      });

    if (error) throw error;
  }
};
