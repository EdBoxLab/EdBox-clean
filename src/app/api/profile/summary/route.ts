import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Fetch XP + level — check both user_xp and learner_states
        const [
            { data: xpData },
            { data: learnerState },
            { data: streakData },
        ] = await Promise.all([
            supabase.from('user_xp').select('total_xp, level').eq('user_id', user.id).single(),
            supabase.from('learner_states').select('total_xp, level, streak, skill_mastery').eq('user_id', user.id).maybeSingle(),
            supabase.from('user_streaks').select('current_streak, longest_streak, last_activity_date').eq('user_id', user.id).single(),
        ]);

        // Prefer user_xp table, fall back to learner_states
        const totalXp = xpData?.total_xp || learnerState?.total_xp || 0;
        const level = xpData?.level || learnerState?.level || 1;
        const currentStreak = streakData?.current_streak || learnerState?.streak || 0;
        const longestStreak = streakData?.longest_streak || 0;

        // ── Topics Mastered: union of all mastery sources ──
        //
        // 1. genie_user_mastery — topics taught by Genie AI with status = 'mastered'
        const { count: genieTopicsMastered } = await supabase
            .from('genie_user_mastery')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'mastered');

        // 2. skill_progress — skills completed through the skill graph path
        const { count: skillsMastered } = await supabase
            .from('skill_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'mastered');

        // 3. user_skill_progress — mastery via challenges
        const { count: challengeMastered } = await supabase
            .from('user_skill_progress')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('mastery_achieved', true);

        // 4. Pulse skill sessions — topics marked covered by Genie in Pulse
        const { data: pulseSessions } = await supabase
            .from('skill_session_progress')
            .select('skill_id, status, topics_covered, current_stage')
            .eq('user_id', user.id);

        const pulseTopicsMastered = (pulseSessions || [])
            .reduce((sum, s) => sum + (s.topics_covered?.length || 0), 0);

        // Total is the union across all sources
        // Use max to avoid double-counting if same skill appears in multiple tables
        const totalTopicsMastered = Math.max(
            (genieTopicsMastered || 0) + (pulseTopicsMastered || 0),
            (genieTopicsMastered || 0),
            pulseTopicsMastered
        ) + (skillsMastered || 0) + (challengeMastered || 0);

        // Session counts
        const sessions = pulseSessions || [];
        const completedSessions = sessions.filter(s => s.status === 'completed').length;
        const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length;

        // Evidence count — all interaction events
        const { count: pulseEvidence } = await supabase
            .from('pulse_session_events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const { count: genieEvidence } = await supabase
            .from('genie_decision_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const { count: assessmentEvidence } = await supabase
            .from('understanding_assessments')
            .select('id', { count: 'exact', head: true });
        // Note: understanding_assessments is linked via session_id, not user_id directly
        // so we just count pulse + genie logs as primary evidence

        const totalEvidence = (pulseEvidence || 0) + (genieEvidence || 0);

        // learner_states.skill_mastery JSONB — number of skills with mastery recorded
        const skillMasteryKeys = Object.keys(learnerState?.skill_mastery || {});
        const learnedFromState = skillMasteryKeys.length;

        return NextResponse.json({
            profile: {
                displayName: profile?.full_name || user.email?.split('@')[0] || 'Learner',
                avatarUrl: profile?.avatar_url || null,
                goal: profile?.learning_goal || profile?.goal || null,
                education: profile?.education || null,
                bio: profile?.bio || null,
                memberSince: profile?.created_at || user.created_at,
                username: profile?.username || user.id,
            },
            xp: {
                total: totalXp,
                level,
            },
            streak: {
                current: currentStreak,
                longest: longestStreak,
                lastActivity: streakData?.last_activity_date || null,
            },
            learning: {
                // "Topics Mastered" = all confirmed mastered topics across all learning modes
                totalTopicsMastered: totalTopicsMastered + learnedFromState,
                completedSkills: completedSessions + (skillsMastered || 0) + (challengeMastered || 0),
                activeSkills: inProgressSessions,
                totalSessions: sessions.length,
                evidencePoints: totalEvidence,
                // Breakdown for display
                breakdown: {
                    fromGenieBrain: genieTopicsMastered || 0,
                    fromPulse: pulseTopicsMastered,
                    fromChallenges: challengeMastered || 0,
                    fromSkillGraph: learnedFromState
                }
            }
        });
    } catch (error) {
        console.error('[profile summary API] error:', error);
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
}
