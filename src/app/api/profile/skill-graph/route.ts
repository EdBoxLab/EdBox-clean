import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // ── Source 1: Genie Brain mastery (course-based learning via Genie AI)
        // genie_user_mastery joins to genie_knowledge_nodes to get course + topic info
        const { data: genieMastery } = await supabase
            .from('genie_user_mastery')
            .select(`
        mastery_score,
        status,
        attempts_count,
        last_attempt_at,
        genie_knowledge_nodes (
          id, course_id, title, description, level, order_index
        )
      `)
            .eq('user_id', user.id);

        // ── Source 2: Skill Graph progress (from the skill graph learning path tool)
        const { data: skillProgress } = await supabase
            .from('skill_progress')
            .select('skill_graph_id, skill_id, status, mastery_score, quiz_scores, challenge_results, time_spent_minutes, attempts_count, current_milestone, mastered_at, last_activity_at')
            .eq('user_id', user.id);

        // ── Source 3: User skill progress (challenge-based skill mastery)
        const { data: userSkillProgress } = await supabase
            .from('user_skill_progress')
            .select('skill_id, challenges_completed, challenges_required, success_rate, mastery_achieved, total_attempts, xp_earned, last_attempt')
            .eq('user_id', user.id);

        // ── Source 4: Pulse skill sessions (Pulse-specific learning)
        const { data: pulseSessions } = await supabase
            .from('skill_session_progress')
            .select('skill_id, graph_id, current_stage, topics_covered, mastery_signals, status, curriculum, updated_at')
            .eq('user_id', user.id);

        // ── Source 5: Pulse events (widget interactions)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const { data: pulseEvents } = await supabase
            .from('pulse_session_events')
            .select('skill_id, graph_id, event_type, event_data, created_at')
            .eq('user_id', user.id)
            .gte('created_at', ninetyDaysAgo.toISOString());

        // ── Source 6: User competency (concept-level confidence)
        const { data: userCompetency } = await supabase
            .from('user_competency')
            .select('topic, concept, confidence, mastery_state, last_updated')
            .eq('user_id', user.id);

        // ── Source 7: Skill graphs (to resolve graph IDs to goals/names)
        const graphIds = [...new Set([
            ...(pulseSessions || []).map(p => p.graph_id),
            ...(pulseEvents || []).map(e => e.graph_id),
        ].filter(Boolean))];

        let skillGraphsMap: Record<string, any> = {};
        if (graphIds.length > 0) {
            const { data: graphs } = await supabase
                .from('skill_graphs')
                .select('id, goal, nodes')
                .in('id', graphIds);
            (graphs || []).forEach(g => { skillGraphsMap[g.id] = g; });
        }

        // ── Source 8: Learner states (XP, badges, skill_mastery JSONB)
        const { data: learnerState } = await supabase
            .from('learner_states')
            .select('skill_mastery, current_skill, badges')
            .eq('user_id', user.id)
            .maybeSingle();

        // ─────────────────────────────────────────────
        // Build the unified domain model
        // ─────────────────────────────────────────────
        const domainsMap: Record<string, {
            name: string;
            graphId: string;
            skills: any[];
        }> = {};

        // ── A: Process Genie Brain mastery data (group by course_id)
        const courseNodeMap: Record<string, any[]> = {};
        (genieMastery || []).forEach(m => {
            const node = (m as any).genie_knowledge_nodes;
            if (!node) return;
            const key = node.course_id || 'unknown';
            if (!courseNodeMap[key]) courseNodeMap[key] = [];
            courseNodeMap[key].push({ ...node, mastery_score: m.mastery_score, status: m.status, attempts: m.attempts_count });
        });

        // Build domain entries from Genie Brain course data
        Object.entries(courseNodeMap).forEach(([courseId, nodes]) => {
            const masteredNodes = nodes.filter(n => n.status === 'mastered');
            const inProgressNodes = nodes.filter(n => n.status === 'in_progress' || (n.mastery_score > 0 && n.status !== 'mastered'));
            const avgMastery = nodes.length > 0
                ? Math.round(nodes.reduce((s, n) => s + (Number(n.mastery_score) || 0), 0) / nodes.length * 100)
                : 0;

            // Look up competency data for topics in this course
            const relevantCompetency = (userCompetency || []).filter(c =>
                c.topic.toLowerCase().includes(courseId.toLowerCase()) ||
                nodes.some(n => n.title.toLowerCase().includes(c.concept.toLowerCase()))
            );
            const avgConfidence = relevantCompetency.length > 0
                ? Math.round(relevantCompetency.reduce((s, c) => s + (c.confidence || 0), 0) / relevantCompetency.length * 100)
                : avgMastery;

            const domainScore = Math.round((avgMastery * 0.6) + (avgConfidence * 0.4));

            if (!domainsMap[courseId]) {
                domainsMap[courseId] = {
                    name: courseId.replace(/-/g, ' ').replace(/_/g, ' '),
                    graphId: courseId,
                    skills: []
                };
            }

            // Add each node as a "skill" within the course domain
            nodes.forEach(node => {
                domainsMap[courseId].skills.push({
                    skillId: node.id,
                    skillTitle: node.title,
                    graphId: courseId,
                    graphGoal: courseId,
                    currentStage: node.status === 'mastered' ? 'Mastery' : node.status === 'in_progress' ? 'Proficient' : 'Foundation',
                    topicsCovered: masteredNodes.length,
                    totalTopics: nodes.length,
                    overallScore: Math.round(Number(node.mastery_score) * 100),
                    comprehension: Math.round(Number(node.mastery_score) * 100),
                    depth: node.attempts > 1 ? Math.max(40, Math.round(Number(node.mastery_score) * 90)) : Math.round(Number(node.mastery_score) * 70),
                    engagement: Math.min(100, (node.attempts || 1) * 20),
                    consistency: 50,
                    evidenceCount: node.attempts || 0,
                    masteryLabel: node.status === 'mastered' ? 'Expert' : node.status === 'in_progress' ? 'Developing' : 'Building',
                    lastActive: node.last_attempt_at || null,
                    source: 'genie_brain'
                });
            });
        });

        // ── B: Process skill_progress (skill graph path data)
        const skillProgressByGraph: Record<string, any[]> = {};
        (skillProgress || []).forEach(sp => {
            const gid = sp.skill_graph_id;
            if (!skillProgressByGraph[gid]) skillProgressByGraph[gid] = [];
            const quizAvg = sp.quiz_scores && sp.quiz_scores.length > 0
                ? Math.round(sp.quiz_scores.reduce((s: number, q: number) => s + Number(q), 0) / sp.quiz_scores.length)
                : 0;
            const challengeResults = Array.isArray(sp.challenge_results) ? sp.challenge_results : [];
            const challengeSuccess = challengeResults.length > 0
                ? Math.round(challengeResults.filter((c: any) => c.passed || c.success).length / challengeResults.length * 100)
                : 0;

            // Match with user_skill_progress for challenge data
            const usp = (userSkillProgress || []).find(u => u.skill_id === sp.skill_id);
            const successRate = usp ? Math.round(Number(usp.success_rate) * 100) : challengeSuccess;
            const masteryAchieved = sp.status === 'mastered' || usp?.mastery_achieved;

            const overallScore = Math.round(
                Number(sp.mastery_score) * 40 +
                quizAvg * 0.3 +
                successRate * 0.3
            );

            skillProgressByGraph[gid].push({
                skillId: sp.skill_id,
                skillTitle: sp.skill_id.replace(/-/g, ' ').replace(/_/g, ' '),
                graphId: gid,
                graphGoal: skillGraphsMap[gid]?.goal || gid,
                currentStage: sp.current_milestone === 'mastery' ? 'Mastery' : sp.current_milestone || 'Foundation',
                topicsCovered: masteryAchieved ? 1 : 0,
                totalTopics: 1,
                overallScore: Math.min(100, Math.max(0, overallScore)),
                comprehension: quizAvg,
                depth: successRate,
                engagement: Math.min(100, (sp.time_spent_minutes || 0) / 30 * 100),
                consistency: Math.min(100, (sp.attempts_count || 0) * 15),
                evidenceCount: (sp.attempts_count || 0) + challengeResults.length,
                masteryLabel: masteryAchieved ? 'Expert' : overallScore >= 70 ? 'Advanced' : overallScore >= 50 ? 'Proficient' : overallScore >= 25 ? 'Developing' : 'Building',
                lastActive: sp.last_activity_at || null,
                source: 'skill_progress'
            });
        });

        // Add skill_progress to domains
        Object.entries(skillProgressByGraph).forEach(([graphId, skills]) => {
            if (!domainsMap[graphId] && skills.length > 0) {
                domainsMap[graphId] = {
                    name: skillGraphsMap[graphId]?.goal || graphId.replace(/-/g, ' '),
                    graphId,
                    skills
                };
            } else if (domainsMap[graphId]) {
                // Merge: add skills not already in domain
                const existingIds = new Set(domainsMap[graphId].skills.map(s => s.skillId));
                skills.forEach(s => { if (!existingIds.has(s.skillId)) domainsMap[graphId].skills.push(s); });
            }
        });

        // ── C: Pulse skill sessions (keep existing logic for Pulse-specific)
        const pulseProg = pulseSessions || [];
        const pulseEvts = pulseEvents || [];

        pulseProg.forEach(session => {
            const graphId = session.graph_id;
            const graph = skillGraphsMap[graphId];
            const skillEvents = pulseEvts.filter(e => e.skill_id === session.skill_id);
            const learningSignals = skillEvents.filter(e => e.event_type === 'learning_signal');

            const comprehension = learningSignals.length > 0
                ? Math.round(learningSignals.reduce((s: number, e: any) => s + (e.event_data?.confidence || 0.5), 0) / learningSignals.length * 100)
                : 50;
            const depth = learningSignals.length > 0
                ? Math.round(learningSignals.reduce((s: number, e: any) => s + (e.event_data?.depth || 0.4), 0) / learningSignals.length * 100)
                : 40;
            const topicsCovered = (session.topics_covered || []).length;
            const overallScore = Math.round(comprehension * 0.4 + depth * 0.3 + Math.min(100, topicsCovered * 15) * 0.3);

            const stageToScore: Record<string, number> = { Foundation: 0, Developing: 1, Proficient: 2, Advanced: 3, Mastery: 4 };
            const stageIdx = stageToScore[session.current_stage || 'Foundation'] || 0;
            const masteryLabel = stageIdx >= 4 ? 'Expert' : stageIdx >= 3 ? 'Advanced' : stageIdx >= 2 ? 'Proficient' : stageIdx >= 1 ? 'Developing' : 'Building';

            const skill = {
                skillId: session.skill_id,
                skillTitle: (graph?.nodes || []).find((n: any) => n.id === session.skill_id)?.title || session.skill_id || 'Unknown Skill',
                graphId,
                graphGoal: graph?.goal || 'Unknown Course',
                currentStage: session.current_stage || 'Foundation',
                topicsCovered,
                totalTopics: session.curriculum?.stages?.reduce((s: number, st: any) => s + (st.topics?.length || 0), 0) || 0,
                overallScore,
                comprehension,
                depth,
                engagement: Math.min(100, skillEvents.filter(e => e.event_type !== 'learning_signal').length * 5),
                consistency: 50,
                evidenceCount: skillEvents.length,
                masteryLabel,
                lastActive: session.updated_at || null,
                source: 'pulse'
            };

            if (!domainsMap[graphId]) {
                domainsMap[graphId] = { name: graph?.goal || graphId, graphId, skills: [] };
            }
            const existing = domainsMap[graphId].skills.find(s => s.skillId === session.skill_id);
            if (!existing) domainsMap[graphId].skills.push(skill);
        });

        // ── Finalize domains list with domain scores
        const domains = Object.values(domainsMap)
            .filter(d => d.skills.length > 0)
            .map(d => ({
                ...d,
                skills: d.skills.sort((a: any, b: any) => b.overallScore - a.overallScore),
                domainScore: Math.round(d.skills.reduce((s: number, sk: any) => s + sk.overallScore, 0) / d.skills.length)
            }))
            .sort((a, b) => b.domainScore - a.domainScore);

        // ── Activity timeline (all events from genie_decision_logs + pulse_session_events)
        const { data: genieDecisionLogs } = await supabase
            .from('genie_decision_logs')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', ninetyDaysAgo.toISOString());

        const allActivityDates = [
            ...(pulseEvts || []).map(e => e.created_at),
            ...(genieDecisionLogs || []).map(e => e.created_at),
            ...(skillProgress || []).filter(s => s.last_activity_at).map(s => s.last_activity_at!),
        ].filter(Boolean);

        const dateCounts: Record<string, number> = {};
        allActivityDates.forEach(ts => {
            const date = ts.split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });
        const today = new Date();
        const activityTimeline = Array.from({ length: 364 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (363 - i));
            const dateStr = d.toISOString().split('T')[0];
            return { date: dateStr, count: dateCounts[dateStr] || 0 };
        });

        // ── Final stats
        const totalSkillsTracked = domains.reduce((s, d) => s + d.skills.length, 0);
        const totalEvidencePoints = allActivityDates.length;
        const overallCVScore = domains.length
            ? Math.round(domains.reduce((s, d) => s + d.domainScore, 0) / domains.length)
            : 0;
        const topDomains = domains.slice(0, 6);

        return NextResponse.json({
            domains,
            totalSkillsTracked,
            totalEvidencePoints,
            strongestDomain: domains[0]?.name || null,
            overallCVScore,
            radarLabels: topDomains.map(d => d.name),
            radarValues: topDomains.map(d => d.domainScore),
            activityTimeline
        });

    } catch (error) {
        console.error('[skill-graph API] error:', error);
        return NextResponse.json({ error: 'Failed to compute skill graph' }, { status: 500 });
    }
}
