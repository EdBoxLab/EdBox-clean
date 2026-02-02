import { createClient } from '@supabase/supabase-js';
import { MasteryRecord, UserCompetency, UserSkillProgress, LearnerState } from './types';

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

  async updateMastery(
    userId: string,
    nodeId: string,
    score: number,
    courseId?: string,
    skillTitle?: string
  ): Promise<boolean> {
    const status = score >= 80 ? 'mastered' : score > 0 ? 'in_progress' : 'not_started';
    const masteryAchieved = score >= 80;

    // Verify node exists in either genie_atomic_nodes or genie_knowledge_nodes
    const { data: atomicExists } = await supabase
      .from('genie_atomic_nodes')
      .select('id')
      .eq('id', nodeId)
      .single();

    const { data: legacyExists } = !atomicExists ? await supabase
      .from('genie_knowledge_nodes')
      .select('id')
      .eq('id', nodeId)
      .single() : { data: null };

    const nodeExists = !!(atomicExists || legacyExists);

    if (!nodeExists) {
      console.warn(`[MasteryTracker] Node ${nodeId} not found, creating it...`);
      
      // Get the next order_index for this course
      const { data: lastNode } = await supabase
        .from('genie_knowledge_nodes')
        .select('order_index')
        .eq('course_id', courseId || 'interactive-course')
        .order('order_index', { ascending: false })
        .limit(1)
        .single();
      
      const nextOrderIndex = (lastNode?.order_index || 0) + 1;
      
      const { data: newNode, error: insertError } = await supabase
        .from('genie_knowledge_nodes')
        .insert({
          id: nodeId,
          course_id: courseId || 'interactive-course',
          title: skillTitle || `Node ${nodeId.slice(0, 8)}`,
          description: `Learning node for ${skillTitle || 'interactive course'}`,
          content: `Auto-generated content for ${skillTitle || 'interactive course'}`,
          level: 1,
          order_index: nextOrderIndex
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`[MasteryTracker] Failed to create node ${nodeId}:`, insertError);
        return false;
      }
      console.log(`[MasteryTracker] Created node ${nodeId} for course ${courseId || 'interactive-course'}`);
    }

    // Update main mastery table with atomic-like increment behavior if possible
    // Since we don't have an RPC here, we use a single upsert but we still need the previous count for manual increment
    // unless we use a raw SQL query or RPC. For now, let's at least optimize the flow.
    
    const { data: currentMastery } = await supabase
      .from('genie_user_mastery')
      .select('attempts_count')
      .eq('user_id', userId)
      .eq('node_id', nodeId)
      .single();

    const newAttempts = (currentMastery?.attempts_count || 0) + 1;

    const { error } = await supabase
      .from('genie_user_mastery')
      .upsert({
        user_id: userId,
        node_id: nodeId,
        mastery_score: score,
        status: status,
        attempts_count: newAttempts,
        last_attempt_at: new Date().toISOString(),
      }, { onConflict: 'user_id,node_id' });

    if (error) throw error;

    // Sync to user_competency for broader tracking
    const { data: node } = await supabase
      .from('genie_knowledge_nodes')
      .select('title, course_id')
      .eq('id', nodeId)
      .single();

    if (node) {
      await supabase
        .from('user_competency')
        .upsert({
          user_id: userId,
          topic: node.course_id,
          concept: node.title,
          confidence: score / 100,
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id,topic,concept' });
    }

    return masteryAchieved;
  },

  async getEligibleNodes(userId: string, courseId: string): Promise<string[]> {
    // Optimization: Fetch only necessary data and use a single query for mastery if possible
    // For now, let's keep the logic but make it cleaner.
    const { data: nodes } = await supabase
      .from('genie_knowledge_nodes')
      .select('id, prerequisite_ids')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (!nodes || nodes.length === 0) return [];

    const { data: mastery } = await supabase
      .from('genie_user_mastery')
      .select('node_id')
      .eq('user_id', userId)
      .eq('status', 'mastered');

    const masteredIds = new Set(mastery?.map(m => m.node_id) || []);

    return nodes
      .filter(node => {
        if (masteredIds.has(node.id)) return false;
        const prerequisites = node.prerequisite_ids || [];
        if (prerequisites.length === 0) return true;
        return (prerequisites as string[]).every((id: string) => masteredIds.has(id));
      })
      .map(node => node.id);
  },

  async updateSkillProgress(userId: string, skillId: string, success: boolean, xp: number = 10) {
    const { data: currentProgress } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    const totalAttempts = (currentProgress?.total_attempts || 0) + 1;
    const challengesCompleted = (currentProgress?.challenges_completed || 0) + (success ? 1 : 0);
    
    // Fix: Prevent NaN if totalAttempts is 0 (though it shouldn't be here)
    const successRate = totalAttempts > 0 ? challengesCompleted / totalAttempts : 0;
    
    const challengesRequired = currentProgress?.challenges_required || 3;
    const masteryAchieved = challengesCompleted >= challengesRequired && successRate >= 0.7;

    await supabase
      .from('user_skill_progress')
      .upsert({
        user_id: userId,
        skill_id: skillId,
        challenges_completed: challengesCompleted,
        total_attempts: totalAttempts,
        success_rate: successRate,
        mastery_achieved: masteryAchieved,
        xp_earned: (currentProgress?.xp_earned || 0) + (success ? xp : 2),
        last_attempt: new Date().toISOString()
      }, { onConflict: 'user_id,skill_id' });

    // Update learner state (global XP/level)
    if (success) {
      const { data: state } = await supabase
        .from('learner_states')
        .select('total_xp, level')
        .eq('user_id', userId)
        .single();

      if (state) {
        const newXp = state.total_xp + xp;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        
        await supabase
          .from('learner_states')
          .update({ 
            total_xp: newXp, 
            level: newLevel,
            last_active: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }
  }
};
