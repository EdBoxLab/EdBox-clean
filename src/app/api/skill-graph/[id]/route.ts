import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch skill graph
        const { data: graph, error: graphError } = await supabase
            .from('skill_graphs')
            .select('*')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (graphError || !graph) {
            return NextResponse.json({ error: 'Skill graph not found' }, { status: 404 });
        }

        // Fetch user progress for this graph
        const { data: progressRecords } = await supabase
            .from('user_progress')
            .select('*')
            .eq('skill_graph_id', params.id)
            .eq('user_id', user.id);

        // Transform progress into { skillId: masteryLevel } format
        const progressMap = (progressRecords || []).reduce((acc: Record<string, number>, p: any) => {
            acc[p.skill_id] = p.mastery_level;
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            graph: {
                id: graph.id,
                userId: graph.user_id,
                goal: graph.goal,
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
