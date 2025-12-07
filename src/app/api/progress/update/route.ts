import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { skillGraphId, skillId, masteryDelta, challengeId } = await request.json();

        if (!skillGraphId || !skillId || masteryDelta === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch current progress
        const { data: existing } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('skill_graph_id', skillGraphId)
            .eq('skill_id', skillId)
            .single();

        let newMasteryLevel = masteryDelta;
        let challengesCompleted = challengeId ? [challengeId] : [];

        if (existing) {
            // Update existing progress
            newMasteryLevel = Math.min(existing.mastery_level + masteryDelta, 1.0);
            challengesCompleted = [
                ...(existing.challenges_completed || []),
                ...(challengeId ? [challengeId] : [])
            ];
        }

        // Upsert progress
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: user.id,
                skill_graph_id: skillGraphId,
                skill_id: skillId,
                mastery_level: newMasteryLevel,
                challenges_completed: challengesCompleted,
                last_practiced: new Date().toISOString(),
            }, {
                onConflict: 'user_id,skill_graph_id,skill_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Progress Update Error:', error);
            throw new Error('Failed to update progress');
        }

        return NextResponse.json({
            success: true,
            progress: {
                skillId: data.skill_id,
                masteryLevel: data.mastery_level,
                challengesCompleted: data.challenges_completed,
            }
        });

    } catch (error: any) {
        console.error('Progress API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update progress' },
            { status: 500 }
        );
    }
}
