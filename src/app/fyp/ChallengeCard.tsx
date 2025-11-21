import React, { useState, useEffect, useRef } from 'react';
import type { ChallengeFeedItem } from './types';
import { Confetti } from './hooks/Confetti';
import { CardImage } from './CardImage';

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
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
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
    <div className="w-full text-center flex flex-col justify-center items-center h-full">
        <Confetti isFiring={isCorrect === true} />
        <div className="absolute top-16 sm:top-20 right-2 sm:right-6 bg-black/30 p-1.5 sm:p-2 rounded-full font-bold text-xl sm:text-2xl">
            <span className={getTimerColor()}>{timeLeft}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 drop-shadow-lg text-yellow-300 px-2">{item.title}</h2>
        
        {item.imageGenerationState && (
            <div className="w-full max-w-[80%] sm:max-w-xs my-3 sm:my-4 rounded-xl overflow-hidden shadow-lg">
            <CardImage 
                generationState={item.imageGenerationState}
                imageUrl={item.image_url}
                altText={item.title}
            />
            </div>
        )}

        <p className="text-base sm:text-lg md:text-xl max-w-md leading-relaxed mb-6 sm:mb-8 px-2">{item.question}</p>
        
        <form onSubmit={handleSubmit} className="w-full max-w-sm px-2">
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