import React, { useState } from 'react';
import type { PollFeedItem } from '@/types/feed';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, CheckCircle2, TrendingUp, Users } from 'lucide-react';

interface PollCardProps {
    item: PollFeedItem;
    isActive: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ item, isActive }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    const handleVote = (optionId: string) => {
        if (hasVoted) return;
        setSelectedOption(optionId);
        setHasVoted(true);
    };

    const totalVotes = item.total_votes + (hasVoted ? 1 : 0);

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-slate-950">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.15),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.05),transparent_70%)]" />

            {/* Poll Icon Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] block mb-0.5">Pulse Check</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Genie's Poll</h3>
                </div>
            </motion.div>

            {/* Question */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-10 z-10 px-2"
            >
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 leading-[1.2] tracking-tight">
                    {item.question}
                </h2>
            </motion.div>

            {/* Options */}
            <div className="w-full max-w-sm space-y-3.5 z-10">
                {item.options.map((option, index) => {
                    const isSelected = selectedOption === option.id;
                    const voteCount = option.votes + (isSelected ? 1 : 0);
                    const percentage = Math.round((voteCount / (totalVotes || 1)) * 100);

                    return (
                        <motion.button
                            key={option.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            onClick={() => handleVote(option.id)}
                            disabled={hasVoted}
                            className={`group relative w-full p-4.5 rounded-2xl border transition-all duration-500 overflow-hidden ${hasVoted
                                ? isSelected
                                    ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                    : 'border-white/5 bg-white/5'
                                : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/10 active:scale-[0.98]'
                                }`}
                        >
                            {/* Progress bar background on vote */}
                            <AnimatePresence mode="wait">
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                                        className={`absolute inset-0 h-full ${isSelected ? 'bg-purple-500/20' : 'bg-white/5'
                                            }`}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative flex items-center justify-between z-20">
                                <span className={`font-semibold text-base transition-colors duration-300 ${isSelected ? 'text-purple-300' : hasVoted ? 'text-white/60' : 'text-white/90'
                                    }`}>
                                    {option.text}
                                </span>

                                <div className="flex items-center gap-3">
                                    {hasVoted && (
                                        <motion.span
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-sm font-bold text-white/40 tabular-nums"
                                        >
                                            {percentage}%
                                        </motion.span>
                                    )}
                                    {isSelected && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="bg-purple-500/20 p-1 rounded-full border border-purple-500/50"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex items-center gap-8 z-10"
            >
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                    <Users className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs font-semibold text-white/40 tabular-nums tracking-wide">{totalVotes.toLocaleString()} VOTES</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Live Status</span>
                </div>
            </motion.div>

            {/* Animated particles for wow factor */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-purple-500/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-20, 20],
                            opacity: [0, 0.4, 0],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
