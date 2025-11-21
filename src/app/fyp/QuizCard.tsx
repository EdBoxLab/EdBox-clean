import React, { useState, useEffect } from 'react';
import type { QuizFeedItem } from './types';
import { Confetti } from './hooks/Confetti';
import { CardImage } from './CardImage';

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

    // Automatically advance after a delay
    setTimeout(() => {
      onSwipe(item.id, 'answered');
    }, 1200); // 1.2 second delay to see result
  };

  const getButtonClass = (option: string) => {
    if (!answered) {
      return 'bg-white/10 hover:bg-white/20';
    }
    if (option === item.answer) {
      return 'bg-green-500/80 ring-2 ring-white/50 animate-pulse';
    }
    if (option === selected && option !== item.answer) {
      return 'bg-red-500/80';
    }
    return 'bg-white/10 opacity-50';
  };

  return (
    <div className="w-full text-center flex flex-col justify-center items-center h-full">
      <Confetti isFiring={isCorrect === true} />

      {item.imageGenerationState && (
        <div className="w-full max-w-[90%] sm:max-w-sm mb-3 sm:mb-4 rounded-xl overflow-hidden shadow-lg">
          <CardImage 
            generationState={item.imageGenerationState}
            imageUrl={item.image_url}
            altText={item.title}
          />
        </div>
      )}

      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 drop-shadow-lg px-2 sm:px-4">{item.title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 w-full max-w-md px-2">
        {item.options?.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={answered}
            className={`p-2 sm:p-3 md:p-4 rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 transform active:scale-95 ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <p className="mt-6 sm:mt-8 text-gray-300 text-xs sm:text-sm animate-pulse">Next card coming up...</p>
      )}
    </div>
  );
};
