'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import { LearningGoal } from '@/types/interactive-course';

interface GoalTrackerProps {
    goals: LearningGoal[];
    className?: string;
}

export default function GoalTracker({ goals, className = '' }: GoalTrackerProps) {
    if (!goals || goals.length === 0) return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-700/50 bg-gray-800/20 ${className}`}>
            <Circle className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-500 italic">Goals will appear as you start learning</p>
        </div>
    );

    const completedCount = goals.filter(g => g.status === 'mastered').length;
    const progress = (completedCount / goals.length) * 100;
    const isAllMastered = completedCount === goals.length;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header & Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-white/90">
                    <span className="flex items-center gap-2">
                        <Trophy className={`w-4 h-4 ${isAllMastered ? 'text-yellow-400' : 'text-indigo-400'}`} />
                        {isAllMastered ? 'Skill Mastered!' : 'Learning Goals'}
                    </span>
                    <span>{Math.round(progress)}%</span>
                </div>

                <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${isAllMastered ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    />
                </div>
            </div>

            {/* Goal List */}
            <div className="space-y-2">
                <AnimatePresence>
                    {goals.map((goal, index) => (
                        <motion.div
                            key={goal.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                flex items-start gap-3 p-3 rounded-xl border transition-all duration-300
                ${goal.status === 'mastered'
                                    ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]'
                                    : 'bg-gray-800/30 border-gray-700/30'}
              `}
                        >
                            <div className="mt-0.5 shrink-0">
                                {goal.status === 'mastered' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-500" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className={`text-sm ${goal.status === 'mastered' ? 'text-green-100 line-through decoration-green-500/30' : 'text-gray-300'}`}>
                                    {goal.text}
                                </p>
                                {goal.status === 'mastered' && goal.evidence && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[10px] uppercase tracking-wide text-green-400/80 font-medium"
                                    >
                                        Mastered
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
