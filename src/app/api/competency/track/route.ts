import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { skillGraphId } = await request.json();

        if (!skillGraphId) {
            return NextResponse.json({ error: 'Skill graph ID required' }, { status: 400 });
        }

        // Fetch skill graph
        const { data: graph } = await supabase
            .from('skill_graphs')
            .select('*')
            .eq('id', skillGraphId)
            .eq('user_id', user.id)
            .single();

        if (!graph) {
            return NextResponse.json({ error: 'Skill graph not found' }, { status: 404 });
        }

        // Fetch all progress for this graph
        const { data: progressRecords } = await supabase
            .from('user_progress')
            .select('*')
            .eq('skill_graph_id', skillGraphId)
            .eq('user_id', user.id);

        // Calculate competencies
        const competencies = (progressRecords || []).map(p => ({
            skillId: p.skill_id,
            masteryLevel: p.mastery_level,
            challengesCompleted: p.challenges_completed?.length || 0,
            lastPracticed: p.last_practiced,
            isMastered: p.mastery_level >= 0.8,
        }));

        const totalSkills = graph.nodes.length;
        const masteredSkills = competencies.filter(c => c.isMastered).length;
        const overallMastery = competencies.length > 0
            ? competencies.reduce((sum, c) => sum + c.masteryLevel, 0) / competencies.length
            : 0;

        // Check if eligible for certificate
        const eligibleForCertificate = masteredSkills >= totalSkills * 0.8; // 80% mastery required

        return NextResponse.json({
            success: true,
            competencies,
            summary: {
                totalSkills,
                masteredSkills,
                inProgress: competencies.filter(c => c.masteryLevel > 0 && !c.isMastered).length,
                notStarted: totalSkills - competencies.length,
                overallMastery,
                eligibleForCertificate,
            }
        });

    } catch (error: any) {
        console.error('Competency Tracking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch competencies' },
            { status: 500 }
        );
    }
}
