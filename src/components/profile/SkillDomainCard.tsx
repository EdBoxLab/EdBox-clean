'use client';

import { useState } from 'react';
import { SkillScore, MasteryLabel } from '@/lib/services/skill-score-calculator';
import { ChevronDown, Zap, Brain, Clock, BarChart2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Mastery color system — solid colors with opacity, NO gradients ── */
const MASTERY: Record<MasteryLabel, { pill: string; label: string; bar: string }> = {
    Building: { pill: 'bg-slate-500/10 text-slate-400 border-border/30', label: 'text-slate-400', bar: 'bg-slate-500' },
    Developing: { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'text-blue-400', bar: 'bg-blue-500' },
    Proficient: { pill: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'text-indigo-400', bar: 'bg-indigo-500' },
    Advanced: { pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'text-purple-400', bar: 'bg-purple-500' },
    Expert: { pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'text-emerald-400', bar: 'bg-emerald-500' },
};

/* ── Skill Pill ── */
function SkillPill({ skill, isActive, onSelect }: { skill: SkillScore; isActive: boolean; onSelect: () => void }) {
    const m = MASTERY[skill.masteryLabel];
    return (
        <button
            onClick={onSelect}
            className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border
                transition-all duration-200 active:scale-95
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${isActive
                    ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-sm'
                    : `${m.pill} hover:-translate-y-0.5 hover:shadow-sm`}
            `}
        >
            <span className={isActive ? 'text-white' : ''}>
                {skill.skillTitle.length > 24 ? skill.skillTitle.substring(0, 23) + '…' : skill.skillTitle}
            </span>
            <span className="font-mono text-[11px] opacity-60">{skill.overallScore}%</span>
        </button>
    );
}

/* ── Detail drawer — the ONE memorable detail per SKILL.md §1 ── */
function SkillDetail({ skill }: { skill: SkillScore }) {
    const m = MASTERY[skill.masteryLabel];
    const dims = [
        { key: 'Comprehension', val: skill.comprehension, Icon: Brain, color: 'bg-blue-500' },
        { key: 'Depth', val: skill.depth, Icon: BarChart2, color: 'bg-purple-500' },
        { key: 'Engagement', val: skill.engagement, Icon: Zap, color: 'bg-amber-500' },
        { key: 'Consistency', val: skill.consistency, Icon: Clock, color: 'bg-emerald-500' },
    ] as const;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
        >
            <div className="mt-4 rounded-xl border border-border/40 bg-card p-5">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h4 className="text-base font-bold text-foreground tracking-tight">{skill.skillTitle}</h4>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${m.pill}`}>{skill.masteryLabel}</span>
                            <span>Stage {skill.currentStage}</span>
                            <span>·</span>
                            <span>{skill.evidenceCount} interactions</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-3xl font-black font-mono text-foreground tracking-tight">
                            {skill.overallScore}<span className="text-muted-foreground text-base font-semibold">%</span>
                        </div>
                    </div>
                </div>

                {/* 4-dimension grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {dims.map(({ key, val, Icon, color }) => (
                        <div key={key} className="rounded-lg border border-border/30 bg-background/50 p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                    <Icon className="w-3 h-3" /> {key}
                                </span>
                                <span className="text-[11px] font-bold font-mono text-foreground">{val}%</span>
                            </div>
                            <div className="h-1 bg-border/40 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${val}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                                    className={`h-full rounded-full ${color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Verified badge */}
                {skill.evidenceCount >= 5 && (
                    <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified by EdBox
                        </div>
                        <span className="text-muted-foreground">
                            {skill.topicsCovered}/{skill.totalTopics} topics
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Domain Card ── */
interface SkillDomainCardProps {
    name: string;
    domainScore: number;
    skills: SkillScore[];
}

export default function SkillDomainCard({ name, domainScore, skills }: SkillDomainCardProps) {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const advancedCount = skills.filter(s => s.masteryLabel === 'Expert' || s.masteryLabel === 'Advanced').length;

    return (
        <div className="rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 hover:border-border">
            {/* Header — clickable */}
            <button
                onClick={() => { setOpen(o => !o); if (open) setActiveId(null); }}
                className="w-full flex items-center justify-between p-6 text-left group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors duration-200">
                        <Brain className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-blue-400 transition-colors duration-200">{name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {skills.length} skill{skills.length !== 1 ? 's' : ''}{advancedCount > 0 ? ` · ${advancedCount} advanced` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xl font-black font-mono text-foreground group-hover:text-blue-400 transition-colors duration-200">
                        {domainScore}<span className="text-muted-foreground text-xs font-semibold">%</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Progress bar */}
            <div className="px-6 pb-2">
                <div className="h-px bg-border/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${domainScore}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="h-full bg-blue-500"
                    />
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 pt-3">
                            <div className="flex flex-wrap gap-2">
                                {skills.map(s => (
                                    <SkillPill
                                        key={s.skillId}
                                        skill={s}
                                        isActive={activeId === s.skillId}
                                        onSelect={() => setActiveId(activeId === s.skillId ? null : s.skillId)}
                                    />
                                ))}
                            </div>
                            <AnimatePresence mode="wait">
                                {activeId && (
                                    <SkillDetail key={activeId} skill={skills.find(s => s.skillId === activeId)!} />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
