import React, { useState, useEffect } from 'react';
import type { QuizFeedItem } from '@/types/feed';
import { Confetti } from './Confetti';
import { CardImage } from './CardImage';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';
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
        }, 3000);
    };

    const getTimerColor = () => {
        if (timeLeft > 20) return 'text-green-400';
        if (timeLeft > 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-transparent">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.15),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.1),transparent_70%)]" />

            <Confetti isFiring={isCorrect === true} />

            {/* Premium Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-6 z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] block mb-0.5 flex items-center gap-2">
                        Pulse Check
                        {timeLeft < 10 && <span className={`animate-pulse ${getTimerColor()}`}>• {timeLeft}s</span>}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Genie's Quiz</h3>
                </div>
            </motion.div>

            {/* Image (if any) */}
            {item.imageGenerationState && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm mb-6 rounded-2xl overflow-hidden shadow-2xl z-10 border border-white/10 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent z-10" />
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            {/* Question */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-8 z-10 px-2"
            >
                <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 leading-[1.2] tracking-tight">
                    {item.question}
                </h2>
            </motion.div>

            {/* Options - Moved up with margin-bottom */}
            <div className="w-full max-w-sm space-y-3.5 z-10 mb-24">
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
                            className={`group relative w-full p-4.5 rounded-2xl border transition-all duration-500 overflow-hidden ${answered
                                ? isCorrectOption
                                    ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                                    : isSelected
                                        ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                                        : 'border-white/5 bg-white/5 opacity-40'
                                : 'border-white/10 bg-white/5 hover:border-purple-500/30 hover:bg-white/10 active:scale-[0.98]'
                                }`}
                        >
                            {/* Sliding Progress Bar */}
                            <AnimatePresence mode="wait">
                                {answered && (isCorrectOption || isSelected) && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
                                        className={`absolute inset-0 h-full ${isCorrectOption ? 'bg-green-500/20' : 'bg-red-500/20'
                                            }`}
                                    />
                                )}
                            </AnimatePresence>

                            <div className="relative flex items-center justify-between z-20">
                                <span className={`font-semibold text-base transition-colors duration-300 ${answered
                                    ? isCorrectOption
                                        ? 'text-green-300'
                                        : isSelected
                                            ? 'text-red-300'
                                            : 'text-white/40'
                                    : 'text-white/90'
                                    }`}>
                                    {option}
                                </span>

                                <div className="flex items-center gap-3">
                                    {answered && isCorrectOption && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="bg-green-500/20 p-1 rounded-full border border-green-500/50"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        </motion.div>
                                    )}
                                    {answered && isSelected && !isCorrectOption && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="bg-red-500/20 p-1 rounded-full border border-red-500/50"
                                        >
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        </motion.div>
                                    )}
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
                        className="mt-8 z-10 w-full max-w-sm"
                    >
                        <div className={`text-xl font-black uppercase tracking-[0.2em] mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? 'Stunning!' : 'Nice try!'}
                        </div>

                        {showExplanation && item.explanation && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-sm font-medium text-white/70 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm leading-relaxed"
                            >
                                {item.explanation}
                            </motion.div>
                        )}
                        <p className="mt-6 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Next card incoming</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(10)].map((_, i) => (
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
