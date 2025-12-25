import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ params is a Promise
) {
  try {
    const { id } = await context.params; // ✅ await the params
    const supabase = await createSupabaseServerClient();

    // Fetch the user using SSR cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch skill graph for this user
    const { data: graph, error: graphError } = await supabase
      .from('skill_graphs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (graphError || !graph) {
      return NextResponse.json({ error: 'Skill graph not found' }, { status: 404 });
    }

    // Fetch user progress for this graph
    const { data: progressRecords } = await supabase
      .from('user_progress')
      .select('*')
      .eq('skill_graph_id', id)
      .eq('user_id', user.id);

    // Transform progress into { skillId: masteryLevel } format
    const progressMap = (progressRecords || []).reduce(
      (acc: Record<string, number>, p: any) => {
        acc[p.skill_id] = p.mastery_level;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
        graph: {
          id: graph.id,
          userId: graph.user_id,
          goal: graph.goal,
          context: graph.context,
          totalSkills: graph.total_skills,
          estimatedHours: graph.estimated_hours,
          skillPaths: graph.skill_paths,
          miniProjects: graph.mini_projects,
          capstone_project: graph.capstone_project,
          nodes: graph.nodes,
          edges: graph.edges,
          createdAt: graph.created_at,
          updatedAt: graph.updated_at,
        },
      progress: progressMap,
    });
  } catch (error: any) {
    console.error('Skill Graph Retrieval Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch skill graph' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the skill graph (user_progress and interactive_course_sessions should cascade if configured, 
    // but we'll do it explicitly if needed. The schema suggests cascade is often used.)
    const { error: deleteError } = await supabase
      .from('skill_graphs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    console.error('Skill Graph Deletion Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete skill graph' },
      { status: 500 }
    );
  }
}
