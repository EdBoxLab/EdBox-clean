import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GenieDecision {
  id?: string;
  session_id: string;
  iteration_id?: string;
  user_id: string;
  node_id: string;
  concept: string;
  action: string;
  thought_process: string;
  evaluation_score: number;
  feedback: string;
  remediation_node_id?: string;
  mastery_status: string;
  mastery_score: number;
  conversation_history_length: number;
  context_sources_count: number;
  input_message: string;
  full_decision: Record<string, any>;
  created_at?: string;
}

export const DecisionLogger = {
  async logDecision(decision: GenieDecision): Promise<string | null> {
    const { data, error } = await supabase
      .from('genie_decision_logs')
      .insert({
        session_id: decision.session_id,
        iteration_id: decision.iteration_id,
        user_id: decision.user_id,
        node_id: decision.node_id,
        concept: decision.concept,
        action: decision.action,
        thought_process: decision.thought_process,
        evaluation_score: decision.evaluation_score,
        feedback: decision.feedback,
        remediation_node_id: decision.remediation_node_id,
        mastery_status: decision.mastery_status,
        mastery_score: decision.mastery_score,
        conversation_history_length: decision.conversation_history_length,
        context_sources_count: decision.context_sources_count,
        input_message: decision.input_message,
        full_decision: decision.full_decision
      })
      .select('id')
      .single();

    if (error) {
      console.error('[DecisionLogger] Failed to log decision:', error);
      return null;
    }

    return data.id;
  },

  async getDecisionHistory(sessionId: string, limit = 50) {
    const { data, error } = await supabase
      .from('genie_decision_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DecisionLogger] Failed to get history:', error);
      return [];
    }

    return data;
  },

  async getDecisionsByAction(sessionId: string, action: string) {
    const { data, error } = await supabase
      .from('genie_decision_logs')
      .select('*')
      .eq('session_id', sessionId)
      .eq('action', action)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DecisionLogger] Failed to get decisions by action:', error);
      return [];
    }

    return data;
  },

  async getMasteryProgress(userId: string, nodeId: string) {
    const { data, error } = await supabase
      .from('genie_decision_logs')
      .select('evaluation_score, action, created_at')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[DecisionLogger] Failed to get mastery progress:', error);
      return [];
    }

    return data;
  }
};
