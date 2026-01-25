import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeManager } from '@/lib/genie/brain/knowledge';
import { SessionManager } from '@/lib/genie/brain/session';
import { VectorBrain } from '@/lib/genie/brain/vector';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, content, timeLimit } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and courseId' },
        { status: 400 }
      );
    }

    // 1. Extract Hierarchical Knowledge Graph (HKG)
    // If content is not provided, fetch it from study_kit_content
    let courseContent = content;
    if (!courseContent) {
      const supabase = await createSupabaseServerClient();
      const { data: kit } = await supabase
        .from('study_kit_content')
        .select('source_content')
        .eq('id', courseId)
        .single();
      courseContent = kit?.source_content;
    }

    if (!courseContent) {
      return NextResponse.json({ error: 'Course content not found' }, { status: 404 });
    }

    const nodes = await KnowledgeManager.extractHKG(courseId, courseContent, timeLimit);

    // 2. Index nodes for vector search
    for (const node of nodes) {
      await VectorBrain.indexNode(node.id, `${node.title}: ${node.description}\n\n${node.content}`);
    }

    // 3. Initialize session
    const session = await SessionManager.getOrCreateSession(userId, courseId);
    
    // 4. Set initial node
    if (nodes.length > 0) {
      await SessionManager.updateCurrentNode(session.id, nodes[0].id);
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      nodes_count: nodes.length
    });

  } catch (error) {
    console.error('Failed to create interactive course:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
