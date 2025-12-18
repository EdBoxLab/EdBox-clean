import React, { useState, useEffect, useRef } from 'react';
import type { ChallengeFeedItem } from '@/types/feed';
import { Confetti } from './Confetti';
import { CardImage } from './CardImage';
import { Target, Timer, Zap, Trophy, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChallengeCardProps {
    item: ChallengeFeedItem;
    isActive: boolean;
    onCorrect: (xp: number, isStreak: boolean) => void;
    onIncorrect: () => void;
    onSwipe: (id: string, action: 'answered') => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ item, isActive, onCorrect, onIncorrect, onSwipe }) => {
    const [timeLeft, setTimeLeft] = useState(item.time_limit);
    const [inputValue, setInputValue] = useState('');
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isActive) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive]);

    useEffect(() => {
        if (timeLeft === 0 && !answered) {
            setAnswered(true);
            setIsCorrect(false);
            onIncorrect();
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => {
                onSwipe(item.id, 'answered');
            }, 1500);
        }
    }, [timeLeft, answered, onIncorrect, item.id, onSwipe]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (answered) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setAnswered(true);
        const userAnsw = inputValue.trim().toLowerCase();
        const correctAnsw = item.answer.toLowerCase();

        // Fuzzy match: exact, or user input contains correct answer, or vice versa
        // We only allow this if the answer is at least 3 chars to avoid false positives
        const isFuzzyMatch = userAnsw.includes(correctAnsw) || correctAnsw.includes(userAnsw);
        const correct = userAnsw === correctAnsw || (correctAnsw.length > 3 && isFuzzyMatch);

        setIsCorrect(correct);

        if (correct) {
            onCorrect(item.xp_reward, item.streak_bonus);
        } else {
            onIncorrect();
        }

        setTimeout(() => {
            onSwipe(item.id, 'answered');
        }, 1200);
    };

    const getTimerColor = () => {
        if (timeLeft > item.time_limit / 2) return 'text-green-400';
        if (timeLeft > item.time_limit / 4) return 'text-yellow-400';
        return 'text-red-500 animate-pulse';
    };

    const getBorderColor = () => {
        if (!answered) return 'border-white/20 focus:border-purple-400';
        if (isCorrect) return 'border-green-500';
        return 'border-red-500';
    }

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-2 sm:px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-red-900/20" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-500/20 to-transparent" />

            <Confetti isFiring={isCorrect === true} />

            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between w-full max-w-sm sm:max-w-md mb-3 sm:mb-4"
            >
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-orange-400 font-bold text-sm">CHALLENGE</span>
                    {item.streak_bonus && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-bold">STREAK</span>
                        </div>
                    )}
                </div>

                <motion.div
                    animate={{
                        scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
                        rotate: timeLeft <= 5 ? [0, -5, 5, 0] : 0
                    }}
                    transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
                    className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-full"
                >
                    <Timer className={`w-4 h-4 ${getTimerColor()}`} />
                    <span className={`font-bold ${getTimerColor()}`}>{timeLeft}s</span>
                </motion.div>
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 drop-shadow-lg bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent px-1 sm:px-2 leading-tight"
            >
                {item.title}
            </motion.h2>

            {item.imageGenerationState && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-[280px] sm:max-w-xs mb-3 sm:mb-4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-orange-500/20"
                >
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-base lg:text-lg max-w-sm sm:max-w-md leading-relaxed mb-4 sm:mb-6 px-1 sm:px-2 bg-black/30 p-3 sm:p-4 rounded-xl border border-orange-500/20"
            >
                {item.question}
            </motion.p>

            <motion.form
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full max-w-xs sm:max-w-sm"
            >
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={answered}
                        placeholder="Type your answer..."
                        className={`w-full p-3 sm:p-4 bg-black/40 backdrop-blur-sm border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all duration-200 text-sm sm:text-base ${getBorderColor()}`}
                    />
                    <motion.button
                        type="submit"
                        disabled={answered || !inputValue.trim()}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        whileHover={{ scale: answered ? 1 : 1.05 }}
                        whileTap={{ scale: answered ? 1 : 0.95 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-600 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </motion.button>
                </div>
            </motion.form>


            <AnimatePresence>
                {answered && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="mt-6 text-center"
                    >
                        <div className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? '🎯 Correct!' : '❌ Time\'s up!'}
                        </div>

                        {!isCorrect && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg"
                            >
                                The answer was: <span className="text-green-400 font-bold">{item.answer}</span>
                            </motion.div>
                        )}

                        <p className="mt-3 text-gray-400 text-xs animate-pulse">Next challenge coming up...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};