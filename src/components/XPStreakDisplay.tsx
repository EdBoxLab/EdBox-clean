import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { useStreakXP } from '@/lib/hooks/useStreakXP';

interface XPStreakDisplayProps {
    userId?: string;
    skillGraphId?: string;
    showCompact?: boolean;
}

export function XPStreakDisplay({ showCompact = false }: XPStreakDisplayProps) {
    const { streak, xp, loading, checkIn } = useStreakXP();

    useEffect(() => {
        checkIn();
    }, [checkIn]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 sm:gap-3 text-gray-400 animate-pulse">
                <div className="h-8 w-20 sm:w-24 bg-white/5 rounded-xl border border-white/10"></div>
            </div>
        );
    }

    if (showCompact) {
        return (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-2xl border border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl shadow-2xl">
                {/* XP Section */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-indigo-500/20 rounded-lg sm:rounded-xl border border-indigo-500/30">
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 fill-indigo-400/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none mb-0.5 sm:mb-1">XP</span>
                        <span className="text-xs sm:text-sm font-black text-white leading-none tracking-tight">{xp.total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="w-[1px] h-6 sm:h-8 bg-white/10 mx-0.5 sm:mx-1" />

                {/* Streak Section */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-orange-500/20 rounded-lg sm:rounded-xl border border-orange-500/30">
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 fill-orange-400/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[9px] font-black text-orange-400/80 uppercase tracking-[0.15em] sm:tracking-[0.2em] leading-none mb-0.5 sm:mb-1">Streak</span>
                        <span className="text-xs sm:text-sm font-black text-white leading-none tracking-tight">{streak.current}d</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-zinc-900 via-indigo-900/10 to-zinc-900 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl max-w-[90vw]"
        >
            <div className="flex flex-col items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-8">
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-indigo-500/10 rounded-xl sm:rounded-2xl border border-indigo-500/20">
                            <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-400" />
                        </div>
                        <div className="text-center">
                            <div className="text-[8px] sm:text-xs font-black text-indigo-400/60 uppercase tracking-widest mb-0.5 sm:mb-1">Total XP</div>
                            <div className="text-xl sm:text-3xl font-black text-white tracking-tighter">{xp.total.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="w-[1px] h-12 sm:h-16 bg-white/10" />

                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-orange-500/10 rounded-xl sm:rounded-2xl border border-orange-500/20">
                            <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-orange-400" />
                        </div>
                        <div className="text-center">
                            <div className="text-[8px] sm:text-xs font-black text-orange-400/60 uppercase tracking-widest mb-0.5 sm:mb-1">Day Streak</div>
                            <div className="text-xl sm:text-3xl font-black text-white tracking-tighter">{streak.current}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp.progress / (xp.xpForNextLevel - xp.xpForCurrentLevel)) * 100}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                </div>
                <div className="text-[8px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">
                    Level {xp.level} &bull; {xp.xpForNextLevel - xp.progress} XP to Level {xp.level + 1}
                </div>
            </div>
        </motion.div>
    );
}
