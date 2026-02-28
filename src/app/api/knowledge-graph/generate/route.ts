import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * POST /api/knowledge-graph/generate
 * 
 * Computes and persists the user's Knowledge Graph from ALL learning data.
 * This is called when the user visits their profile or on-demand.
 * 
 * Data sources:
 * 1. skill_graphs        — user's courses (nodes contain skills)
 * 2. skill_progress       — per-skill mastery, quiz scores, challenge results
 * 3. user_skill_progress  — challenge completion + success rates
 * 4. genie_user_mastery   — Genie Brain topic-level mastery
 * 5. genie_knowledge_nodes — topic titles + course mapping
 * 6. user_competency      — concept-level confidence scores
 * 7. pulse_session_events — widget interaction telemetry
 * 8. skill_session_progress — Pulse skill session data
 * 9. genie_decision_logs  — activity timeline entries
 * 10. learner_states      — XP, badges, skill_mastery JSONB
 */

export async function POST() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // ────────────────────────────────────────
        // FETCH ALL DATA SOURCES IN PARALLEL
        // ────────────────────────────────────────
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const [
            { data: userCourses },
            { data: genieMastery },
            { data: skillProgress },
            { data: userSkillProgress },
            { data: userCompetency },
            { data: pulseSessions },
            { data: pulseEvents },
            { data: genieDecisionLogs },
            { data: learnerState },
        ] = await Promise.all([
            // 1. All courses this user has
            supabase.from('skill_graphs').select('id, goal, nodes, total_skills, estimated_hours, created_at').eq('user_id', user.id),
            // 2. Genie brain mastery with knowledge node details
            supabase.from('genie_user_mastery').select('mastery_score, status, attempts_count, last_attempt_at, node_id, genie_knowledge_nodes(id, course_id, title, level)').eq('user_id', user.id),
            // 3. Skill progress per course
            supabase.from('skill_progress').select('skill_graph_id, skill_id, status, mastery_score, quiz_scores, challenge_results, time_spent_minutes, attempts_count, current_milestone, mastered_at, last_activity_at').eq('user_id', user.id),
            // 4. Challenge-based mastery
            supabase.from('user_skill_progress').select('skill_id, challenges_completed, challenges_required, success_rate, mastery_achieved, total_attempts, xp_earned, last_attempt').eq('user_id', user.id),
            // 5. Concept-level confidence
            supabase.from('user_competency').select('topic, concept, confidence, last_updated').eq('user_id', user.id),
            // 6. Pulse skill sessions
            supabase.from('skill_session_progress').select('skill_id, graph_id, current_stage, topics_covered, mastery_signals, status, curriculum, updated_at').eq('user_id', user.id),
            // 7. Pulse widget interaction events (last 90 days)
            supabase.from('pulse_session_events').select('skill_id, graph_id, event_type, event_data, created_at').eq('user_id', user.id).gte('created_at', ninetyDaysAgo.toISOString()),
            // 8. Genie decision logs for activity timeline
            supabase.from('genie_decision_logs').select('created_at').eq('user_id', user.id).gte('created_at', ninetyDaysAgo.toISOString()),
            // 9. Learner state (XP, badges, skill_mastery)
            supabase.from('learner_states').select('skill_mastery, badges').eq('user_id', user.id).maybeSingle(),
        ]);

        // ────────────────────────────────────────
        // BUILD DOMAINS FROM COURSES
        // ────────────────────────────────────────
        const domainsMap: Record<string, {
            name: string;
            graphId: string;
            skills: any[];
        }> = {};

        const courses = userCourses || [];
        const spArr = skillProgress || [];
        const uspArr = userSkillProgress || [];

        // Build a lookup for skill_progress and user_skill_progress
        const spByKey: Record<string, any> = {};
        spArr.forEach(sp => { spByKey[`${sp.skill_graph_id}::${sp.skill_id}`] = sp; });
        const uspBySkill: Record<string, any> = {};
        uspArr.forEach(usp => { uspBySkill[usp.skill_id] = usp; });

        // For each course the user has, build a domain
        courses.forEach(course => {
            const courseId = course.id;
            const nodes = Array.isArray(course.nodes) ? course.nodes : [];
            if (nodes.length === 0) return;

            const skills = nodes.map((node: any) => {
                const sp = spByKey[`${courseId}::${node.id}`];
                const usp = uspBySkill[node.id];

                // Compute scores from available data
                const masteryScore = sp ? Number(sp.mastery_score) : 0;
                const quizScores = sp?.quiz_scores || [];
                const quizAvg = quizScores.length > 0
                    ? quizScores.reduce((s: number, q: number) => s + Number(q), 0) / quizScores.length
                    : 0;
                const challengeResults = Array.isArray(sp?.challenge_results) ? sp.challenge_results : [];
                const challengeSuccessRate = usp ? Number(usp.success_rate) : (
                    challengeResults.length > 0
                        ? challengeResults.filter((c: any) => c.passed || c.success).length / challengeResults.length
                        : 0
                );
                const masteryAchieved = sp?.status === 'mastered' || usp?.mastery_achieved || false;
                const timeSpent = sp?.time_spent_minutes || 0;
                const attemptCount = (sp?.attempts_count || 0) + (usp?.total_attempts || 0);

                // Check Pulse session data for this skill
                const pulseSession = (pulseSessions || []).find(ps => ps.skill_id === node.id && ps.graph_id === courseId);
                const pulseTopicsCovered = pulseSession?.topics_covered?.length || 0;
                const pulseStage = pulseSession?.current_stage || null;

                // Check Pulse telemetry events for this skill
                const skillEvents = (pulseEvents || []).filter(e => e.skill_id === node.id);
                const learningSignals = skillEvents.filter(e => e.event_type === 'learning_signal');

                // ── Compute 4 dimensions ──

                // Comprehension: confidence from learning signals, or mastery score, or quiz avg
                let comprehension = 0;
                if (learningSignals.length > 0) {
                    comprehension = Math.round(learningSignals.reduce((s: number, e: any) => s + (e.event_data?.confidence || 0.5), 0) / learningSignals.length * 100);
                } else if (quizAvg > 0) {
                    comprehension = Math.round(quizAvg);
                } else if (masteryScore > 0) {
                    comprehension = Math.round(masteryScore * 100);
                }

                // Depth: learning signal depth, or challenge success rate
                let depth = 0;
                if (learningSignals.length > 0) {
                    depth = Math.round(learningSignals.reduce((s: number, e: any) => s + (e.event_data?.depth || 0.4), 0) / learningSignals.length * 100);
                    // Bonus for high-quality signal types
                    const deepSignals = learningSignals.filter((e: any) =>
                        ['deep_understanding', 'applied_correctly', 'asked_insightful_question', 'correct_under_pressure'].includes(e.event_data?.signal_type));
                    depth = Math.min(100, depth + deepSignals.length * 5);
                } else if (challengeSuccessRate > 0) {
                    depth = Math.round(challengeSuccessRate * 100);
                } else if (masteryScore > 0) {
                    depth = Math.round(masteryScore * 70);
                }

                // Engagement: dwell time + actions + attempts
                const dwellSeconds = skillEvents.filter(e => e.event_type === 'widget_dwell')
                    .reduce((s: number, e: any) => s + (e.event_data?.dwell_seconds || 0), 0);
                const actionCount = skillEvents.filter(e => e.event_type !== 'learning_signal' && e.event_type !== 'widget_dwell').length;
                const engagementFromTime = Math.min(50, (timeSpent / 30) * 50 + (dwellSeconds / 900) * 30);
                const engagementFromActions = Math.min(50, actionCount * 3 + attemptCount * 5);
                const engagement = Math.min(100, Math.round(engagementFromTime + engagementFromActions));

                // Consistency: unique days with activity
                const activityDates = new Set([
                    ...(sp?.last_activity_at ? [sp.last_activity_at.split('T')[0]] : []),
                    ...(usp?.last_attempt ? [usp.last_attempt.split('T')[0]] : []),
                    ...skillEvents.map(e => e.created_at?.split('T')[0]).filter(Boolean),
                ]);
                const consistency = Math.min(100, Math.round((activityDates.size / 7) * 100));

                // Overall score
                const overallScore = Math.min(100, Math.round(
                    comprehension * 0.35 + depth * 0.30 + engagement * 0.25 + consistency * 0.10
                ));

                // Stage 
                let currentStage = 'Foundation';
                if (pulseStage) currentStage = pulseStage;
                else if (sp?.current_milestone) currentStage = sp.current_milestone.charAt(0).toUpperCase() + sp.current_milestone.slice(1);
                else if (masteryAchieved) currentStage = 'Mastery';
                else if (overallScore >= 70) currentStage = 'Advanced';
                else if (overallScore >= 50) currentStage = 'Proficient';
                else if (overallScore >= 25) currentStage = 'Developing';

                // Mastery label
                let masteryLabel: string;
                if (masteryAchieved || currentStage === 'Mastery') masteryLabel = 'Expert';
                else if (overallScore >= 70 || currentStage === 'Advanced') masteryLabel = 'Advanced';
                else if (overallScore >= 50 || currentStage === 'Proficient') masteryLabel = 'Proficient';
                else if (overallScore >= 25 || currentStage === 'Developing') masteryLabel = 'Developing';
                else masteryLabel = 'Building';

                // Total topics
                const curriculum = pulseSession?.curriculum;
                const totalTopicsFromCurriculum = curriculum?.stages?.reduce((s: number, st: any) => s + (st.topics?.length || 0), 0) || 0;

                // Evidence count
                const evidenceCount = skillEvents.length + attemptCount + challengeResults.length + quizScores.length;

                return {
                    skillId: node.id,
                    skillTitle: node.title || node.id,
                    graphId: courseId,
                    graphGoal: course.goal,
                    currentStage,
                    topicsCovered: pulseTopicsCovered + (masteryAchieved ? 1 : 0),
                    totalTopics: totalTopicsFromCurriculum || 1,
                    overallScore,
                    comprehension,
                    depth,
                    engagement,
                    consistency,
                    evidenceCount,
                    masteryLabel,
                    lastActive: sp?.last_activity_at || usp?.last_attempt || pulseSession?.updated_at || null,
                };
            });

            // Only include skills that have SOME data (score > 0 or evidence > 0)
            const activeSkills = skills.filter((s: any) => s.overallScore > 0 || s.evidenceCount > 0);

            if (activeSkills.length > 0) {
                const domainScore = Math.round(activeSkills.reduce((s: number, sk: any) => s + sk.overallScore, 0) / activeSkills.length);
                domainsMap[courseId] = {
                    name: course.goal || 'Unknown Course',
                    graphId: courseId,
                    skills: activeSkills.sort((a: any, b: any) => b.overallScore - a.overallScore),
                };
            } else {
                // Even if no active skills, still show the course as a domain with 0 score
                domainsMap[courseId] = {
                    name: course.goal || 'Unknown Course',
                    graphId: courseId,
                    skills: skills.slice(0, 5).map((s: any) => ({ ...s, masteryLabel: 'Building' })),
                };
            }
        });

        // ────────────────────────────────────────
        // ADD GENIE BRAIN MASTERY (non-course topics)
        // ────────────────────────────────────────
        const genieMasteryArr = genieMastery || [];
        const courseNodeGroups: Record<string, any[]> = {};
        genieMasteryArr.forEach((m: any) => {
            const node = m.genie_knowledge_nodes;
            if (!node) return;
            const courseKey = `genie::${node.course_id}`;
            // Skip if this course_id matches an existing skill_graph (avoid double-counting)
            if (courses.some(c => c.id === node.course_id)) return;
            if (!courseNodeGroups[courseKey]) courseNodeGroups[courseKey] = [];
            courseNodeGroups[courseKey].push({
                ...node,
                mastery_score: m.mastery_score,
                status: m.status,
                attempts: m.attempts_count,
                last_attempt: m.last_attempt_at,
            });
        });

        Object.entries(courseNodeGroups).forEach(([key, nodes]) => {
            const courseId = key.replace('genie::', '');
            const skills = nodes.map(node => {
                const score = Math.round(Number(node.mastery_score) * 100);
                return {
                    skillId: node.id,
                    skillTitle: node.title,
                    graphId: key,
                    graphGoal: courseId,
                    currentStage: node.status === 'mastered' ? 'Mastery' : node.status === 'in_progress' ? 'Developing' : 'Foundation',
                    topicsCovered: node.status === 'mastered' ? 1 : 0,
                    totalTopics: 1,
                    overallScore: score,
                    comprehension: score,
                    depth: Math.round(score * 0.8),
                    engagement: Math.min(100, (node.attempts || 0) * 20),
                    consistency: 50,
                    evidenceCount: node.attempts || 0,
                    masteryLabel: node.status === 'mastered' ? 'Expert' : score >= 50 ? 'Developing' : 'Building',
                    lastActive: node.last_attempt || null,
                };
            });

            domainsMap[key] = {
                name: courseId.replace(/-/g, ' ').replace(/_/g, ' '),
                graphId: key,
                skills: skills.sort((a, b) => b.overallScore - a.overallScore),
            };
        });

        // ────────────────────────────────────────
        // FINALIZE DOMAINS
        // ────────────────────────────────────────
        const domains = Object.values(domainsMap).map(d => ({
            ...d,
            domainScore: d.skills.length > 0
                ? Math.round(d.skills.reduce((s, sk) => s + sk.overallScore, 0) / d.skills.length)
                : 0
        })).sort((a, b) => b.domainScore - a.domainScore);

        // ────────────────────────────────────────
        // ACTIVITY TIMELINE
        // ────────────────────────────────────────
        const allDates = [
            ...(pulseEvents || []).map(e => e.created_at),
            ...(genieDecisionLogs || []).map(e => e.created_at),
            ...spArr.filter(s => s.last_activity_at).map(s => s.last_activity_at!),
            ...uspArr.filter(u => u.last_attempt).map(u => u.last_attempt!),
        ].filter(Boolean);

        const dateCounts: Record<string, number> = {};
        allDates.forEach(ts => { const d = ts.split('T')[0]; dateCounts[d] = (dateCounts[d] || 0) + 1; });

        const today = new Date();
        const activityTimeline = Array.from({ length: 364 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (363 - i));
            const dateStr = d.toISOString().split('T')[0];
            return { date: dateStr, count: dateCounts[dateStr] || 0 };
        });

        // ────────────────────────────────────────
        // COMPUTE FINAL STATS
        // ────────────────────────────────────────
        const totalSkillsTracked = domains.reduce((s, d) => s + d.skills.length, 0);
        const totalEvidencePoints = allDates.length + domains.reduce((s, d) => s + d.skills.reduce((ss: number, sk: any) => ss + sk.evidenceCount, 0), 0);
        const overallCVScore = domains.length > 0
            ? Math.round(domains.reduce((s, d) => s + d.domainScore, 0) / domains.length)
            : 0;
        const topDomains = domains.slice(0, 6);
        const radarLabels = topDomains.map(d => d.name);
        const radarValues = topDomains.map(d => d.domainScore);
        const strongestDomain = domains[0]?.name || null;

        // ────────────────────────────────────────
        // PERSIST TO knowledge_graphs TABLE
        // ────────────────────────────────────────
        const knowledgeGraphData = {
            user_id: user.id,
            domains,
            radar_labels: radarLabels,
            radar_values: radarValues,
            overall_cv_score: overallCVScore,
            total_skills_tracked: totalSkillsTracked,
            total_evidence_points: totalEvidencePoints,
            strongest_domain: strongestDomain,
            activity_timeline: activityTimeline,
            last_computed_at: new Date().toISOString(),
        };

        // Upsert — one knowledge graph per user
        const { error: upsertError } = await supabase
            .from('knowledge_graphs')
            .upsert(knowledgeGraphData, { onConflict: 'user_id' });

        if (upsertError) {
            console.error('[knowledge-graph] upsert error:', upsertError);
            // Still return the computed data even if persistence fails
        }

        return NextResponse.json({
            domains,
            totalSkillsTracked,
            totalEvidencePoints,
            strongestDomain,
            overallCVScore,
            radarLabels,
            radarValues,
            activityTimeline,
            lastComputedAt: knowledgeGraphData.last_computed_at,
        });

    } catch (error) {
        console.error('[knowledge-graph] error:', error);
        return NextResponse.json({ error: 'Failed to generate knowledge graph' }, { status: 500 });
    }
}

/**
 * GET /api/knowledge-graph/generate
 * 
 * Returns the cached knowledge graph if available, or computes a new one.
 */
export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Check for a cached knowledge graph
        const { data: cached } = await supabase
            .from('knowledge_graphs')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (cached) {
            // If computed within the last 5 minutes, return cached
            const computedAt = new Date(cached.last_computed_at).getTime();
            const fiveMinAgo = Date.now() - 5 * 60 * 1000;

            if (computedAt > fiveMinAgo) {
                return NextResponse.json({
                    domains: cached.domains,
                    totalSkillsTracked: cached.total_skills_tracked,
                    totalEvidencePoints: cached.total_evidence_points,
                    strongestDomain: cached.strongest_domain,
                    overallCVScore: cached.overall_cv_score,
                    radarLabels: cached.radar_labels,
                    radarValues: cached.radar_values,
                    activityTimeline: cached.activity_timeline,
                    lastComputedAt: cached.last_computed_at,
                    cached: true,
                });
            }
        }

        // No fresh cache — recompute via POST handler
        return POST();
    } catch (error) {
        console.error('[knowledge-graph] GET error:', error);
        return NextResponse.json({ error: 'Failed to load knowledge graph' }, { status: 500 });
    }
}
