import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SessionManager } from '@/lib/genie/brain/session';
import { LearningOrchestrator } from '@/lib/genie/brain/reasoning';
import { MasteryTracker } from '@/lib/genie/brain/mastery';
import { VectorBrain } from '@/lib/genie/brain/vector';

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
    const { data: currentNode, error: nodeError } = await supabase
      .from('genie_knowledge_nodes')
      .select('*')
      .eq('id', sessionData.current_topic)
      .single();

    if (nodeError || !currentNode) {
      return NextResponse.json({ error: 'Current node not found' }, { status: 404 });
    }

    // 2. Get User Mastery for current node
    const mastery = await MasteryTracker.getMastery(userId, currentNode.id);

    // 3. Find related context via Vector Search
    const relatedContext = await VectorBrain.findRelatedNodes(userMessage, 3);

    // 4. Determine Next Action using Learning Orchestrator
    const orchestrator = new LearningOrchestrator();
    const decision = await orchestrator.processUserMessage(
      userMessage,
      currentNode,
      mastery,
      [] // conversationHistory - could be fetched from session if needed
    );

    // 5. Update Mastery based on evaluation
    await MasteryTracker.updateMastery(userId, currentNode.id, decision.evaluation_score);

    // 6. Log interaction
    await SessionManager.logResponse(
      sessionId,
      currentNode.id,
      userMessage,
      decision,
      decision.feedback
    );

    // 7. Handle Transitions
    let nextNodeId = currentNode.id;
    if (decision.action === 'advance') {
      const eligibleNodes = await MasteryTracker.getEligibleNodes(userId, sessionData.course_id);
      if (eligibleNodes.length > 0) {
        nextNodeId = eligibleNodes[0];
        await SessionManager.updateCurrentNode(sessionId, nextNodeId);
      }
    } else if (decision.action === 'remediate') {
      // Remediation logic - could navigate to prerequisite nodes if needed
      // For now, stay on current node
    }

    return NextResponse.json({
      success: true,
      response: decision.feedback,
      next_action: decision.action,
      evaluation: decision.evaluation_score,
      current_node_id: nextNodeId,
      iteration: decision.iteration
    });

  } catch (error: any) {
    console.error('Interactive Course Genie Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process interaction' },
      { status: 500 }
    );
  }
}
