import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { xpGained, activity, skillGraphId } = await request.json();

        if (!xpGained || !activity) {
            return NextResponse.json(
                { error: 'Missing required fields: xpGained and activity' },
                { status: 400 }
            );
        }

        // Get current learner state or create new one
        let learnerStateId = skillGraphId || 'default';
        
        const { data: existingState } = await supabase
            .from('learner_states')
            .select('*')
            .eq('user_id', user.id)
            .eq('skill_graph_id', learnerStateId)
            .single();

        const currentXp = existingState?.total_xp || 0;
        const currentLevel = existingState?.level || 1;
        const newTotalXp = currentXp + xpGained;
        
        // Calculate new level (100 XP per level)
        const newLevel = Math.floor(newTotalXp / 100) + 1;
        const leveledUp = newLevel > currentLevel;

        // Check for streak update
        const now = new Date();
        const lastActive = existingState?.last_active ? new Date(existingState.last_active) : null;
        let newStreak = existingState?.streak || 0;
        
        if (lastActive) {
            const hoursSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceLastActive < 24) {
                // Within same day, maintain streak
                newStreak = existingState.streak;
            } else if (hoursSinceLastActive < 48) {
                // Next day, increment streak
                newStreak = existingState.streak + 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        } else {
            // First activity
            newStreak = 1;
        }

        // Upsert learner state
        const { data: updatedState, error } = await supabase
            .from('learner_states')
            .upsert({
                id: `${user.id}_${learnerStateId}`,
                user_id: user.id,
                skill_graph_id: learnerStateId,
                total_xp: newTotalXp,
                level: newLevel,
                streak: newStreak,
                last_active: now.toISOString(),
                updated_at: now.toISOString(),
            }, {
                onConflict: 'id'
            })
            .select()
            .single();

        if (error) {
            console.error('Learner state update error:', error);
            throw new Error('Failed to update XP and streak');
        }

        return NextResponse.json({
            success: true,
            xp: {
                gained: xpGained,
                total: newTotalXp,
                level: newLevel,
                leveledUp
            },
            streak: newStreak,
            activity
        });

    } catch (error: any) {
        console.error('XP Update API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update XP' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const skillGraphId = searchParams.get('skillGraphId') || 'default';

        const { data: learnerState, error } = await supabase
            .from('learner_states')
            .select('total_xp, level, streak, badges, last_active')
            .eq('user_id', user.id)
            .eq('skill_graph_id', skillGraphId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Learner state fetch error:', error);
            throw new Error('Failed to fetch XP data');
        }

        return NextResponse.json({
            xp: learnerState?.total_xp || 0,
            level: learnerState?.level || 1,
            streak: learnerState?.streak || 0,
            badges: learnerState?.badges || [],
            lastActive: learnerState?.last_active || null
        });

    } catch (error: any) {
        console.error('XP GET API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch XP' },
            { status: 500 }
        );
    }
}
