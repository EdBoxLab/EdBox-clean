import React, { useState, useEffect } from 'react';
import type { QuizFeedItem } from '@/types/feed';
import { Confetti } from './Confetti';
import { CardImage } from './CardImage';
import { Brain, Zap, Trophy, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizCardProps {
    item: QuizFeedItem;
    onCorrect: (xp: number, isStreak: boolean) => void;
    onIncorrect: () => void;
    onSwipe: (id: string, action: 'answered') => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ item, onCorrect, onIncorrect, onSwipe }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (answered) return;
        
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
    }, [answered]);

    const handleAnswer = (option: string) => {
        if (answered) return;
        setSelected(option);
        setAnswered(true);
        const correct = option === item.answer;
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
        }, 2500);
    };

    const getButtonClass = (option: string) => {
        if (!answered) {
            return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 hover:border-purple-400/50 cursor-pointer';
        }
        if (option === item.answer) {
            return 'bg-gradient-to-r from-green-500 to-emerald-500 ring-2 ring-green-300 shadow-lg shadow-green-500/50 cursor-default';
        }
        if (option === selected && option !== item.answer) {
            return 'bg-gradient-to-r from-red-500 to-pink-500 ring-2 ring-red-300 shadow-lg shadow-red-500/50 cursor-default';
        }
        return 'bg-white/10 opacity-50 cursor-default';
    };

    const getTimerColor = () => {
        if (timeLeft > 20) return 'text-green-400';
        if (timeLeft > 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse" />
            
            <Confetti isFiring={isCorrect === true} />

            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-4"
            >
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                    <Timer className={`w-4 h-4 ${getTimerColor()}`} />
                    <span className={`font-bold ${getTimerColor()}`}>{timeLeft}s</span>
                </div>
                {item.streak_bonus && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400 font-bold">STREAK</span>
                    </div>
                )}
            </motion.div>

            {item.imageGenerationState && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-[90%] sm:max-w-sm mb-4 rounded-xl overflow-hidden shadow-2xl"
                >
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-lg sm:text-xl md:text-2xl font-bold mb-6 drop-shadow-lg px-4 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
            >
                {item.question}
            </motion.h2>

            <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg px-4"
            >
                {item.options?.map((option, index) => (
                    <motion.button
                        key={option}
                        initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: answered ? 1 : 1.02 }}
                        whileTap={{ scale: answered ? 1 : 0.98 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAnswer(option);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={answered}
                        className={`p-3 sm:p-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform select-none ${getButtonClass(option)}`}
                    >
                        {option}
                    </motion.button>
                ))}
            </motion.div>

            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400/30"
            >
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-sm">{item.xp_reward} XP</span>
            </motion.div>

            <AnimatePresence>
                {answered && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="mt-6 text-center"
                    >
                        <div className={`text-lg font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                        </div>
                        
                        {showExplanation && item.explanation && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-gray-300 max-w-md mx-auto bg-black/30 p-3 rounded-lg"
                            >
                                {item.explanation}
                            </motion.div>
                        )}
                        
                        <p className="mt-3 text-gray-400 text-xs animate-pulse">Next card coming up...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};