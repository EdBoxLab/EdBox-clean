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
    if (!goals || goals.length === 0) return null;

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
                            <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-sm ${goal.status === 'mastered' ? 'text-green-100 line-through decoration-green-500/30' : 'text-gray-300'}`}>
                                        {goal.text}
                                    </p>
                                    <span className={`text-[10px] font-bold ${goal.confidence >= 70 ? 'text-green-400' : goal.confidence >= 40 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        {Math.round(goal.confidence || 0)}%
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${goal.confidence || 0}%` }}
                                        className={`h-full transition-all duration-500 ${goal.confidence >= 70 ? 'bg-green-500' : goal.confidence >= 40 ? 'bg-yellow-500' : 'bg-gray-600'}`}
                                    />
                                </div>
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
