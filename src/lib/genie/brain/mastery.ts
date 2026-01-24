import { createClient } from '@supabase/supabase-js';
import { MasteryRecord } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const MasteryTracker = {
  async getMastery(userId: string, nodeId: string): Promise<MasteryRecord | null> {
    const { data, error } = await supabase
      .from('genie_user_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateMastery(userId: string, nodeId: string, score: number) {
    const status = score >= 80 ? 'mastered' : score > 0 ? 'in_progress' : 'not_started';
    
    const { error } = await supabase
      .from('genie_user_mastery')
      .upsert({
        user_id: userId,
        node_id: nodeId,
        mastery_score: score,
        status: status,
        last_attempt_at: new Date().toISOString(),
      }, { onConflict: 'user_id,node_id' });

    if (error) throw error;
    
    // Increment attempts count
    await supabase.rpc('increment_mastery_attempts', { p_user_id: userId, p_node_id: nodeId });
  },

  async getEligibleNodes(userId: string, courseId: string): Promise<string[]> {
    // Logic to find nodes where prerequisites are met but not yet mastered
    const { data, error } = await supabase.rpc('get_eligible_genie_nodes', { 
      p_user_id: userId, 
      p_course_id: courseId 
    });

    if (error) throw error;
    return data.map((n: any) => n.id);
  }
};
