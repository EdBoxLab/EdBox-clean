import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SessionManager } from '@/lib/genie/brain/session';
import { CognitiveReasoning } from '@/lib/genie/brain/reasoning';
import { MasteryTracker } from '@/lib/genie/brain/mastery';
import { KnowledgeNode, NodeStateMetadata } from '@/lib/genie/brain/types';

export async function POST(request: NextRequest) {
  try {
    const { userMessage, sessionId } = await request.json();

    if (!userMessage || !sessionId) {
      return NextResponse.json({ error: 'Message and session ID required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { session: authSession } } = await supabase.auth.getSession();

    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authSession.user.id;

    // 1. Get Session state
    const { data: sessionData, error: sessionError } = await supabase
      .from('interactive_course_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch the current node details
    const { data: nodeData, error: nodeError } = await supabase
      .from('genie_knowledge_nodes')
      .select('*')
      .eq('id', sessionData.current_topic)
      .single();

    if (nodeError || !nodeData) {
      return NextResponse.json({ error: 'Current node not found' }, { status: 404 });
    }

    const currentNode: KnowledgeNode = {
      ...nodeData,
      learning_objectives: nodeData.learning_objectives || [],
      passing_criteria: nodeData.passing_criteria || { type: 'challenge', requirement: 'Master the concept', threshold: 80 }
    };

    // 2. Fetch V3 Metadata
    const metadata = await SessionManager.getNodeMetadata(sessionId, currentNode.id);

    // 3. Get User Mastery
    const mastery = await MasteryTracker.getMastery(userId, currentNode.id);

    // 4. Determine Next Action using Cognitive Reasoning (V3)
    const reasoning = await CognitiveReasoning.determineNextAction(
      userMessage,
      currentNode,
      mastery,
      metadata
    );

    // 5. Update Metadata & Persistence
    const updates: Partial<NodeStateMetadata> = {
      sub_state: reasoning.sub_state,
      remediation_flag: reasoning.remediation_flag
    };

    if (reasoning.action === 'explain') updates.explanation_count = (metadata.explanation_count || 0) + 1;
    if (reasoning.action === 'challenge') updates.interaction_count = (metadata.interaction_count || 0) + 1;
    
    updates.mastery_velocity = (reasoning.evaluation_score - (mastery?.mastery_score || 0));

    await SessionManager.updateNodeMetadata(sessionId, currentNode.id, updates);

    // 6. Update Mastery based on evaluation
    await MasteryTracker.updateMastery(userId, currentNode.id, reasoning.evaluation_score, sessionData.course_id, currentNode.title);

    // 7. Log interaction
    await SessionManager.saveMessage(sessionId, 'learner', userMessage, 'question');
    await SessionManager.saveMessage(sessionId, 'genie', reasoning.feedback, 'explanation');

    // 8. Handle Transitions
    let nextNodeId = currentNode.id;
    if (reasoning.action === 'advance') {
      const eligibleNodes = await MasteryTracker.getEligibleNodes(userId, sessionData.course_id);
      if (eligibleNodes.length > 0) {
        nextNodeId = eligibleNodes[0];
        await SessionManager.updateCurrentNode(sessionId, nextNodeId);
      }
    } else if (reasoning.action === 'remediate' && reasoning.remediation_node_id) {
      nextNodeId = reasoning.remediation_node_id;
      await SessionManager.updateCurrentNode(sessionId, nextNodeId);
    }

    return NextResponse.json({
      success: true,
      response: reasoning.feedback,
      next_action: reasoning.action,
      evaluation: reasoning.evaluation_score,
      current_node_id: nextNodeId,
      content: reasoning.content,
      sub_state: reasoning.sub_state
    });

  } catch (error: any) {
    console.error('Interactive Course Genie Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process interaction' },
      { status: 500 }
    );
  }
}
