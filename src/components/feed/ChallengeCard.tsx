import React, { useState, useEffect, useRef } from 'react';
import type { ChallengeFeedItem } from '@/types/feed';
import { Confetti } from './Confetti';
import { CardImage } from './CardImage';
import { Target, Timer, Zap, Trophy, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChallengeCardProps {
    item: ChallengeFeedItem;
    onCorrect: (xp: number, isStreak: boolean) => void;
    onIncorrect: () => void;
    onSwipe: (id: string, action: 'answered') => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ item, onCorrect, onIncorrect, onSwipe }) => {
    const [timeLeft, setTimeLeft] = useState(item.time_limit);
    const [inputValue, setInputValue] = useState('');
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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
        if (answered) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setAnswered(true);
        const correct = inputValue.trim().toLowerCase() === item.answer.toLowerCase();
        setIsCorrect(correct);

        if (correct) {
            onCorrect(item.xp_reward, item.streak_bonus);
        } else {
            onIncorrect();
        }

        setTimeout(() => {
            onSwipe(item.id, 'answered');
        }, 1500); // Delay to show result and answer
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
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-red-900/20" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse" />
            
            <Confetti isFiring={isCorrect === true} />

            {/* Header with Challenge Icon and Timer */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between w-full max-w-md mb-4"
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

            {/* Title */}
            <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl font-bold mb-4 drop-shadow-lg bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent px-2"
            >
                {item.title}
            </motion.h2>

            {/* Image */}
            {item.imageGenerationState && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-xs mb-4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-orange-500/20"
                >
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            {/* Question */}
            <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-base sm:text-lg max-w-md leading-relaxed mb-6 px-2 bg-black/30 p-4 rounded-xl border border-orange-500/20"
            >
                {item.question}
            </motion.p>

            {/* Input Form */}
            <motion.form 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                onSubmit={handleSubmit} 
                className="w-full max-w-sm"
            >
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={answered}
                    placeholder="Your answer..."
                    className={`w-full bg-white/10 text-white text-center text-base sm:text-lg p-3 sm:p-4 rounded-xl border-2 transition-colors duration-300 outline-none ${getBorderColor()}`}
                />
            </form>

            {answered && (
                <div className="mt-6">
                    <p className="text-lg">The answer was: <span className="font-bold text-green-300">{item.answer}</span></p>
                    <p className="mt-2 text-gray-300 text-sm animate-pulse">Next card coming up...</p>
                </div>
            )}
        </div>
    );
};
