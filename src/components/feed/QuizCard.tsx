import React, { useState, useEffect } from 'react';
import type { QuizFeedItem } from '@/types/feed';
import { Confetti } from './Confetti';
import { CardImage } from './CardImage';
import { Brain, Zap, Trophy, Timer, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizCardProps {
    item: QuizFeedItem;
    isActive: boolean;
    onCorrect: (xp: number, isStreak: boolean) => void;
    onIncorrect: () => void;
    onSwipe: (id: string, action: 'answered') => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ item, isActive, onCorrect, onIncorrect, onSwipe }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (!isActive || answered) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleAnswer('');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, answered]);

    const handleAnswer = (option: string) => {
        if (answered) return;
        setSelected(option);
        setAnswered(true);

        // Check correctness: text match or index match
        const correct = option === item.answer || item.options[item.correctIndex] === option;
        setIsCorrect(correct);

        if (correct) {
            onCorrect(item.xp_reward, item.streak_bonus);
        } else {
            onIncorrect();
        }

        setTimeout(() => {
            setShowExplanation(true);
        }, 800);

        setTimeout(() => {
            onSwipe(item.id, 'answered');
        }, 3000); // Give bit more time to see the results
    };

    const getTimerColor = () => {
        if (timeLeft > 20) return 'text-green-400';
        if (timeLeft > 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10" />

            <Confetti isFiring={isCorrect === true} />

            {/* Premium Header (Poll Sync) */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-6 z-10"
            >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20">
                    <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block flex items-center gap-2">
                        Pulse Check
                        {timeLeft < 10 && <span className={`animate-pulse ${getTimerColor()}`}>• {timeLeft}s</span>}
                    </span>
                    <h3 className="text-lg font-bold text-white">Genie's Quiz</h3>
                </div>
            </motion.div>

            {/* Image (if any) */}
            {item.imageGenerationState && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm mb-4 rounded-xl overflow-hidden shadow-2xl z-10 border border-white/5"
                >
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            {/* Question (Poll Style) */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-6 z-10"
            >
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {item.question}
                </h2>
            </motion.div>

            {/* Options (Poll Style: 1-column responsive list) */}
            <div className="w-full max-w-sm space-y-3 z-10">
                {item.options?.map((option, index) => {
                    const isSelected = selected === option;
                    const isCorrectOption = option === item.answer || item.options[item.correctIndex] === option;

                    return (
                        <motion.button
                            key={option}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            onClick={() => handleAnswer(option)}
                            disabled={answered}
                            className={`group relative w-full p-4 rounded-xl border transition-all duration-300 overflow-hidden ${answered
                                    ? isCorrectOption
                                        ? 'border-green-500/50 bg-green-500/10'
                                        : isSelected
                                            ? 'border-red-500/50 bg-red-500/10'
                                            : 'border-white/5 bg-white/5 opacity-50'
                                    : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/10 active:scale-95'
                                }`}
                        >
                            {/* Sliding Progress Bar (Matching Poll Style) */}
                            <AnimatePresence>
                                {answered && (isCorrectOption || isSelected) && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`absolute inset-0 h-full ${isCorrectOption ? 'bg-green-500/20' : 'bg-red-500/20'
                                            }`}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative flex items-center justify-between z-20">
                                <span className={`font-medium transition-colors ${answered
                                        ? isCorrectOption ? 'text-green-400' : isSelected ? 'text-red-400' : 'text-white/60'
                                        : 'text-white'
                                    }`}>
                                    {option}
                                </span>

                                <div className="flex items-center gap-2">
                                    {answered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                    {answered && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-red-400" />}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Explanation / Footer */}
            <AnimatePresence>
                {answered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 z-10"
                    >
                        <div className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? '🎉 Correct!' : '❌ Almost!'}
                        </div>

                        {showExplanation && item.explanation && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-gray-300 max-w-sm mx-auto bg-black/30 p-4 rounded-xl border border-white/5"
                            >
                                {item.explanation}
                            </motion.div>
                        )}
                        <p className="mt-4 text-gray-400 text-xs animate-pulse">Next card coming up...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Particles (Poll Style Sync) */}
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
