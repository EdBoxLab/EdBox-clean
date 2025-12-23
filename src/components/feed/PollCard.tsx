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
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-background">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

            {/* Poll Icon Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-8 z-10"
            >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20">
                    <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">Pulse Check</span>
                    <h3 className="text-lg font-bold text-foreground">Genie's Poll</h3>
                </div>
            </motion.div>

            {/* Question */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-8 z-10"
            >
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                    {item.question}
                </h2>
            </motion.div>

            {/* Options */}
            <div className="w-full max-w-sm space-y-3 z-10">
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
                            className={`group relative w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${hasVoted
                                ? isSelected
                                    ? 'border-primary/50 bg-primary/10'
                                    : 'border-border/50 bg-secondary/50'
                                : 'border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50 active:scale-95'
                                }`}
                        >
                            {/* Progress bar background on vote */}
                            <AnimatePresence>
                                {hasVoted && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`absolute inset-0 h-full ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'
                                            }`}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative flex items-center justify-between z-20">
                                <span className={`font-medium transition-colors ${isSelected ? 'text-primary' : 'text-foreground'
                                    }`}>
                                    {option.text}
                                </span>

                                <div className="flex items-center gap-3">
                                    {hasVoted && (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-sm font-bold text-muted-foreground"
                                        >
                                            {percentage}%
                                        </motion.span>
                                    )}
                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex items-center gap-6 z-10"
            >
                <div className="flex items-center gap-2 text-muted-foreground/60">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">{totalVotes.toLocaleString()} votes</span>
                </div>
                <div className="flex items-center gap-2 text-primary/60">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Live Results</span>
                </div>
            </motion.div>

            {/* Animated particles for wow factor */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-purple-500/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-20, 20],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
