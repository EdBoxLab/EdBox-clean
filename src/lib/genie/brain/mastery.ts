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

  async getNextNode(userId: string, courseId: string, currentNodeId: string): Promise<string | null> {
    // 1. Get all nodes for the course ordered by index
    const { data: nodes, error } = await supabase
      .from('genie_knowledge_nodes')
      .select('id, order_index, level')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error || !nodes) return null;

    // 2. Find current node index
    const currentIndex = nodes.findIndex((n: any) => n.id === currentNodeId);
    if (currentIndex === -1) return nodes[0]?.id || null; // Fallback to start

    // 3. Find next node
    // We simply take the next one in the linear sequence
    const nextNode = nodes[currentIndex + 1];
    if (!nextNode) return null; // Course completed

    return nextNode.id;
  },

  async getEligibleNodes(userId: string, courseId: string): Promise<string[]> {
    // Placeholder for non-linear graph logic (graph traversal)
    // For now, relies on getNextNode for linear
    return [];
  }
};
