'use client';

import { useState } from 'react';
import { SkillScore, MasteryLabel } from '@/lib/services/skill-score-calculator';
import { ChevronDown, Zap, Brain, Clock, BarChart2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MASTERY_COLORS: Record<MasteryLabel, { bg: string; text: string; ring: string }> = {
    Building: { bg: 'bg-slate-700/50', text: 'text-slate-400', ring: 'ring-slate-600' },
    Developing: { bg: 'bg-blue-900/40', text: 'text-blue-400', ring: 'ring-blue-700' },
    Proficient: { bg: 'bg-indigo-900/40', text: 'text-indigo-400', ring: 'ring-indigo-700' },
    Advanced: { bg: 'bg-purple-900/40', text: 'text-purple-400', ring: 'ring-purple-700' },
    Expert: { bg: 'bg-emerald-900/40', text: 'text-emerald-400', ring: 'ring-emerald-700' },
};

interface SkillPillProps {
    skill: SkillScore;
}

function SkillPill({ skill }: SkillPillProps) {
    const [open, setOpen] = useState(false);
    const colors = MASTERY_COLORS[skill.masteryLabel];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 active:scale-95 ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}
            >
                {skill.skillTitle.length > 20 ? skill.skillTitle.substring(0, 19) + '…' : skill.skillTitle}
                <span className="opacity-60 font-normal">{skill.overallScore}%</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 z-50 w-64 bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-white">{skill.skillTitle}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                {skill.masteryLabel}
                            </span>
                        </div>

                        {/* Stage progress */}
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Stage: <span className="text-slate-300 font-medium">{skill.currentStage}</span>
                            · {skill.topicsCovered}{skill.totalTopics > 0 ? `/${skill.totalTopics}` : ''} topics
                        </div>

                        {/* Dimension bars */}
                        <div className="space-y-2">
                            {([
                                { label: 'Comprehension', value: skill.comprehension, icon: Brain, color: 'bg-blue-500' },
                                { label: 'Depth', value: skill.depth, icon: BarChart2, color: 'bg-purple-500' },
                                { label: 'Engagement', value: skill.engagement, icon: Zap, color: 'bg-amber-500' },
                                { label: 'Consistency', value: skill.consistency, icon: Clock, color: 'bg-emerald-500' },
                            ] as const).map(({ label, value, icon: Icon, color }) => (
                                <div key={label}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <Icon className="w-3 h-3" /> {label}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-300">{value}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${value}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] text-slate-600">Evidence</span>
                            <span className="text-[10px] font-semibold text-slate-400">{skill.evidenceCount} interactions</span>
                        </div>

                        {skill.evidenceCount >= 5 && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified by EdBox Genie
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface SkillDomainCardProps {
    name: string;
    domainScore: number;
    skills: SkillScore[];
}

export default function SkillDomainCard({ name, domainScore, skills }: SkillDomainCardProps) {
    const [expanded, setExpanded] = useState(true);

    const expertCount = skills.filter(s => s.masteryLabel === 'Expert' || s.masteryLabel === 'Advanced').length;

    return (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20">
            {/* Header */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between p-5 text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{name}</h3>
                        <p className="text-xs text-slate-500">
                            {skills.length} skill{skills.length !== 1 ? 's' : ''} · {expertCount} advanced
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-lg font-bold text-white">{domainScore}<span className="text-slate-500 text-xs font-normal">%</span></div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Score bar */}
            <div className="px-5 pb-1">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${domainScore}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-blue-500 rounded-full"
                    />
                </div>
            </div>

            {/* Skills pills */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-3">
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <SkillPill key={skill.skillId} skill={skill} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
