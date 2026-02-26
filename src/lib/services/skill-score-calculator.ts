/**
 * Skill Score Calculator
 * 
 * Computes a multi-dimensional skill score from raw `pulse_session_events`.
 * This is the intelligence layer of the Skill Graph CV.
 */

export type MasteryLabel = 'Building' | 'Developing' | 'Proficient' | 'Advanced' | 'Expert';

export interface SkillScore {
    skillId: string;
    skillTitle: string;
    graphId: string;
    graphGoal: string;
    currentStage: string;
    topicsCovered: number;
    totalTopics: number;

    // Composite score (0-100)
    overallScore: number;

    // Dimension scores (0-100 each)
    comprehension: number;  // Avg confidence from learning_signals
    depth: number;          // Avg depth + bonus for applied/insightful signals
    engagement: number;     // Total dwell time + code runs + draws + notes
    consistency: number;    // Spread of activity days (not cramming)

    // Trust indicators
    evidenceCount: number;  // Total events = how much data backs this score
    masteryLabel: MasteryLabel;
    lastActive: string | null;
}

export interface SkillDomain {
    name: string;
    graphId: string;
    skills: SkillScore[];
    domainScore: number;
}

export interface SkillGraphData {
    domains: SkillDomain[];
    totalSkillsTracked: number;
    totalEvidencePoints: number;
    strongestDomain: string | null;
    overallCVScore: number;
    radarLabels: string[];
    radarValues: number[];
    activityTimeline: ActivityDay[];
}

export interface ActivityDay {
    date: string; // 'YYYY-MM-DD'
    count: number;
}

// Event types that contribute to engagement scoring
const ENGAGEMENT_EVENTS = new Set([
    'blackboard_drawn', 'blackboard_read', 'code_typed', 'code_executed',
    'note_written', 'note_previewed', 'neuron_manipulated',
    'custom_widget_interaction', 'study_kit_interacted', 'skill_graph_navigated',
    'genie_message_sent', 'widget_dwell'
]);

// Positive signal types that increase depth score
const DEEP_SIGNALS = new Set(['deep_understanding', 'applied_correctly', 'asked_insightful_question', 'correct_under_pressure']);

function clamp(val: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, val));
}

function stageToIndex(stage: string): number {
    const idx = ['Foundation', 'Developing', 'Proficient', 'Advanced', 'Mastery'].indexOf(stage);
    return idx === -1 ? 0 : idx;
}

function computeMasteryLabel(score: number, stage: string): MasteryLabel {
    const stageIdx = stageToIndex(stage);
    // Weight stage progression heavily — reaching Mastery stage means Expert
    if (stageIdx >= 4 && score >= 70) return 'Expert';
    if (stageIdx >= 3 && score >= 60) return 'Advanced';
    if (stageIdx >= 2 && score >= 50) return 'Proficient';
    if (stageIdx >= 1 && score >= 35) return 'Developing';
    return 'Building';
}

export function computeSkillScore(
    skillId: string,
    events: any[],
    progress: any | null,
    skillTitle: string,
    graphId: string,
    graphGoal: string,
    totalTopicsInCurriculum: number
): SkillScore {
    // Filter events for this specific skill
    const skillEvents = events.filter(e => e.skill_id === skillId || e.event_data?.skill_id === skillId);
    const evidenceCount = skillEvents.length;

    // --- Comprehension Score ---
    const learningSignals = skillEvents.filter(e => e.event_type === 'learning_signal');
    let comprehension = 50; // Default if no signals
    if (learningSignals.length > 0) {
        const avgConfidence = learningSignals.reduce((sum: number, e: any) =>
            sum + (e.event_data?.confidence || 0.5), 0) / learningSignals.length;
        comprehension = clamp(avgConfidence * 100);
    }

    // --- Depth Score ---
    let depth = 40; // Default
    if (learningSignals.length > 0) {
        const avgDepth = learningSignals.reduce((sum: number, e: any) =>
            sum + (e.event_data?.depth || 0.4), 0) / learningSignals.length;

        // Bonus for positive signal types
        const deepSignalCount = learningSignals.filter((e: any) =>
            DEEP_SIGNALS.has(e.event_data?.signal_type)).length;
        const depthBonus = Math.min(20, deepSignalCount * 5);

        depth = clamp(avgDepth * 80 + depthBonus);
    }

    // --- Engagement Score ---
    const engagementEvents = skillEvents.filter(e => ENGAGEMENT_EVENTS.has(e.event_type));
    const totalDwellSeconds = skillEvents
        .filter(e => e.event_type === 'widget_dwell')
        .reduce((sum: number, e: any) => sum + (e.event_data?.dwell_seconds || 0), 0);

    // Normalize: 30 min of engagement = 100 engagement score
    const engagementFromDwell = clamp((totalDwellSeconds / 1800) * 70);
    const engagementFromActions = clamp((engagementEvents.length / 20) * 30); // 20 actions = max
    const engagement = clamp(engagementFromDwell + engagementFromActions);

    // --- Consistency Score ---
    const eventDates = skillEvents.map(e => {
        const d = new Date(e.created_at || Date.now());
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
    const uniqueDays = new Set(eventDates).size;
    // Max consistency at 7+ unique days
    const consistency = clamp((uniqueDays / 7) * 100);

    // --- Overall Score ---
    // Weights: comprehension 35%, depth 30%, engagement 25%, consistency 10%
    const overallScore = clamp(
        comprehension * 0.35 + depth * 0.30 + engagement * 0.25 + consistency * 0.10
    );

    // --- Stage & Topics ---
    const currentStage = progress?.current_stage || 'Foundation';
    const topicsCovered = (progress?.topics_covered || []).length;

    // --- Last Active ---
    const lastEvent = skillEvents.sort((a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
    const lastActive = lastEvent?.created_at || null;

    return {
        skillId,
        skillTitle,
        graphId,
        graphGoal,
        currentStage,
        topicsCovered,
        totalTopics: totalTopicsInCurriculum,
        overallScore: Math.round(overallScore),
        comprehension: Math.round(comprehension),
        depth: Math.round(depth),
        engagement: Math.round(engagement),
        consistency: Math.round(consistency),
        evidenceCount,
        masteryLabel: computeMasteryLabel(overallScore, currentStage),
        lastActive
    };
}

export function computeActivityTimeline(events: any[]): ActivityDay[] {
    const dateCounts: Record<string, number> = {};

    events.forEach(e => {
        if (!e.created_at) return;
        const date = e.created_at.split('T')[0]; // 'YYYY-MM-DD'
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Generate last 52 weeks (364 days)
    const today = new Date();
    const days: ActivityDay[] = [];

    for (let i = 363; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({ date: dateStr, count: dateCounts[dateStr] || 0 });
    }

    return days;
}
