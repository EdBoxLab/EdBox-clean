'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph, SkillNode } from '@/lib/courseCreation/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Sparkles, BookOpen, Target, Trophy, ChevronRight, Play, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSessionProgress, SkillSessionProgress } from '../../services/widget-persistence';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CurriculumStage {
    level: string;
    topics: string[];
    description: string;
    learningObjectives: string[];
    estimatedMinutes: number;
}

interface SkillCurriculum {
    skillId: string;
    title: string;
    stages: CurriculumStage[];
}

interface SkillSessionWidgetProps {
    window: PulseWindow;
    onSendGenieMessage?: (message: string) => void;
}

const STAGE_ORDER = ['Foundation', 'Developing', 'Proficient', 'Advanced', 'Mastery'];

const stageLevelStyles: Record<string, { gradient: string; icon: React.ReactNode; border: string; accent: string }> = {
    'Foundation': { gradient: 'from-blue-500/20 to-cyan-500/20', icon: <BookOpen className="w-5 h-5" />, border: 'border-blue-500/40', accent: 'text-blue-400' },
    'Developing': { gradient: 'from-purple-500/20 to-indigo-500/20', icon: <Target className="w-5 h-5" />, border: 'border-purple-500/40', accent: 'text-purple-400' },
    'Proficient': { gradient: 'from-amber-500/20 to-orange-500/20', icon: <Sparkles className="w-5 h-5" />, border: 'border-amber-500/40', accent: 'text-amber-400' },
    'Advanced': { gradient: 'from-rose-500/20 to-pink-500/20', icon: <Sparkles className="w-5 h-5" />, border: 'border-rose-500/40', accent: 'text-rose-400' },
    'Mastery': { gradient: 'from-emerald-500/20 to-green-500/20', icon: <Trophy className="w-5 h-5" />, border: 'border-emerald-500/40', accent: 'text-emerald-400' },
};

const SkillSessionWidget: React.FC<SkillSessionWidgetProps> = ({ window: pulseWindow, onSendGenieMessage }) => {
    const [skill, setSkill] = useState<SkillNode | null>(null);
    const [graph, setGraph] = useState<SkillGraph | null>(null);
    const [curriculum, setCurriculum] = useState<SkillCurriculum | null>(null);
    const [loading, setLoading] = useState(true);
    const [curriculumLoading, setCurriculumLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [sessionProgress, setSessionProgress] = useState<SkillSessionProgress | null>(null);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [xpEarned, setXpEarned] = useState(0);

    const userFetchedRef = useRef(false);
    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

    const skillId = pulseWindow.data?.skillId;
    const graphId = pulseWindow.data?.graphId;

    // Auth
    useEffect(() => {
        if (userFetchedRef.current) return;
        const supabase = createSupabaseBrowserClient();
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            userFetchedRef.current = true;
        };
        getUser();
    }, []);

    // Fetch skill data + curriculum + progress
    useEffect(() => {
        if (!skillId || !graphId) {
            setError('Missing skill or graph ID');
            setLoading(false);
            return;
        }
        fetchSkillData();
    }, [skillId, graphId]);

    // Load existing progress when user is available + subscribe to realtime updates
    useEffect(() => {
        if (user && skillId && graphId) {
            loadProgress();
            subscribeToProgress();
        }
        return () => {
            // Cleanup realtime channel on unmount
            if (realtimeChannelRef.current) {
                const supabase = createSupabaseBrowserClient();
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
        };
    }, [user, skillId, graphId]);

    const subscribeToProgress = () => {
        if (!user || !skillId || !graphId) return;
        const supabase = createSupabaseBrowserClient();

        // Remove any existing channel first
        if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
        }

        const channel = supabase
            .channel(`skill-progress-${user.id}-${skillId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'skill_session_progress',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = payload.new as SkillSessionProgress;
                    if (
                        updated &&
                        updated.skill_id === skillId &&
                        updated.graph_id === graphId
                    ) {
                        setSessionProgress(updated);
                        setSessionStarted(true);

                        // Show XP flash when topics are covered
                        const prev = payload.old as SkillSessionProgress;
                        const prevTopics = prev?.topics_covered?.length ?? 0;
                        const newTopics = updated.topics_covered?.length ?? 0;
                        if (newTopics > prevTopics) {
                            const gained = (newTopics - prevTopics) * 10;
                            setXpEarned(gained);
                            setTimeout(() => setXpEarned(0), 3000);
                        }
                    }
                }
            )
            .subscribe();

        realtimeChannelRef.current = channel;
    };

    const loadProgress = async () => {
        if (!user || !skillId || !graphId) return;
        const progress = await getSessionProgress(user.id, skillId, graphId);
        if (progress) {
            setSessionProgress(progress);
            setSessionStarted(true);
        }
    };

    const fetchSkillData = async () => {
        try {
            const supabase = createSupabaseBrowserClient();

            const { data: graphData, error: graphError } = await supabase
                .from('skill_graphs')
                .select('*')
                .eq('id', graphId)
                .single();

            if (graphError) throw graphError;
            setGraph(graphData as SkillGraph);

            const foundSkill = graphData.nodes?.find((n: any) => n.id === skillId);
            if (!foundSkill) throw new Error('Skill not found in graph');
            setSkill(foundSkill as SkillNode);

            await fetchCurriculum(foundSkill, graphData.goal);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurriculum = async (skillNode: SkillNode, graphGoal: string) => {
        setCurriculumLoading(true);
        try {
            const res = await fetch('/api/skill-curriculum/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillId: skillNode.id,
                    skillTitle: skillNode.title,
                    skillDescription: skillNode.description,
                    skillLevel: skillNode.level,
                    graphGoal,
                }),
            });

            if (!res.ok) throw new Error('Failed to generate curriculum');
            const data = await res.json();
            setCurriculum(data.curriculum);
        } catch (err: any) {
            console.error('Curriculum generation failed:', err);
        } finally {
            setCurriculumLoading(false);
        }
    };

    const handleStartLearning = () => {
        if (!skill || !curriculum || !onSendGenieMessage) return;

        setSessionStarted(true);

        // Build a rich context message for Genie
        const stagesSummary = curriculum.stages.map((s, i) =>
            `Stage ${i + 1} — ${s.level}: ${s.topics.join(', ')}`
        ).join('\n');

        const currentStage = sessionProgress?.current_stage || 'Foundation';
        const topicsCovered = sessionProgress?.topics_covered || [];
        const resumeContext = topicsCovered.length > 0
            ? `\n\nI've already covered: ${topicsCovered.join(', ')}. I'm currently at the ${currentStage} stage. Continue from where I left off.`
            : '';

        const message = `[SKILL_SESSION_ACTIVE]
skillId: ${skillId}
graphId: ${graphId}
skillTitle: ${skill.title}

I'm ready to learn "${skill.title}" — ${skill.description || ''}.

Here's my curriculum roadmap:
${stagesSummary}

Start with the ${currentStage} stage. Use the blackboard to explain concepts visually and deploy interactive widgets when needed. Teach me thoroughly — when you think I understand a topic, call update_skill_progress to mark it as covered, then move to the next one dynamically.${resumeContext}`;

        onSendGenieMessage(message);
    };

    const handleBackToPath = () => {
        window.location.href = `/learning-path/${graphId}`;
    };

    // Get stage status based on progress
    const getStageStatus = (stageLevel: string): 'completed' | 'current' | 'upcoming' => {
        if (!sessionProgress) {
            return stageLevel === 'Foundation' ? 'current' : 'upcoming';
        }

        const currentIdx = STAGE_ORDER.indexOf(sessionProgress.current_stage);
        const stageIdx = STAGE_ORDER.indexOf(stageLevel);

        if (stageIdx < currentIdx) return 'completed';
        if (stageIdx === currentIdx) return 'current';
        return 'upcoming';
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-950">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">Loading skill session...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !skill || !graph) {
        return (
            <div className="flex items-center justify-center h-full text-red-400 p-4 text-center bg-slate-950">
                <div>
                    <p className="font-semibold mb-2">Unable to load skill session</p>
                    <p className="text-sm text-slate-400">{error || 'Skill not found'}</p>
                    <button
                        onClick={handleBackToPath}
                        className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                        Back to Learning Path
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-slate-950 p-4 md:p-6 relative">
            {/* XP Flash */}
            {xpEarned > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 right-4 z-50 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold text-sm px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                >
                    <Trophy className="w-4 h-4" /> +{xpEarned} XP
                </motion.div>
            )}
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={handleBackToPath}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{skill.title}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">{skill.description}</p>
                </div>
                {sessionProgress && (
                    <div className="text-right">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sessionProgress.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                            {sessionProgress.current_stage}
                        </span>
                    </div>
                )}
            </div>

            {/* Curriculum Stages */}
            {curriculumLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Generating your learning roadmap...</p>
                        <p className="text-slate-500 text-xs mt-1">Foundation → Mastery</p>
                    </div>
                </div>
            ) : curriculum ? (
                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Learning Roadmap
                    </h3>

                    {curriculum.stages.map((stage, index) => {
                        const styles = stageLevelStyles[stage.level] || stageLevelStyles['Foundation'];
                        const status = getStageStatus(stage.level);

                        return (
                            <motion.div
                                key={stage.level}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className={`relative bg-slate-900/80 rounded-xl border ${styles.border} p-4 overflow-hidden ${status === 'completed' ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-30`} />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        {/* Status indicator */}
                                        <div className="text-slate-300">
                                            {status === 'completed' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : status === 'current' ? (
                                                <div className="relative">
                                                    {styles.icon}
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                                                </div>
                                            ) : (
                                                <Circle className="w-5 h-5 text-slate-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Stage {index + 1}</span>
                                            <h4 className="text-base font-bold text-white">{stage.level}</h4>
                                        </div>
                                        <span className="text-xs text-slate-500">~{stage.estimatedMinutes}min</span>
                                    </div>

                                    <p className="text-sm text-slate-400 mb-2">{stage.description}</p>

                                    <div className="space-y-1">
                                        {stage.topics.map((topic, i) => {
                                            const isCovered = sessionProgress?.topics_covered?.includes(topic);
                                            return (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    {isCovered ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                                    ) : (
                                                        <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                                                    )}
                                                    <span className={isCovered ? 'text-slate-500 line-through' : 'text-slate-300'}>{topic}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {index < curriculum.stages.length - 1 && (
                                    <div className="absolute left-8 -bottom-3 w-0.5 h-3 bg-slate-700 z-20" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            ) : null}

            {/* Start / Resume Learning Button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleStartLearning}
                disabled={!curriculum || !onSendGenieMessage}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                <Play className="w-5 h-5" />
                {sessionStarted ? 'Continue Learning with Genie' : 'Start Learning with Genie'}
            </motion.button>

            {sessionStarted && (
                <p className="text-center text-xs text-slate-500 mt-3">
                    Genie is guiding you through the curriculum. Check the chat panel to continue.
                </p>
            )}
        </div>
    );
};

export default SkillSessionWidget;
