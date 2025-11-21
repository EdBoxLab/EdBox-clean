import React, { useState } from 'react';

interface MiniQuizProps {
  question: string;
  options: string[];
  correctAnswer: string;
}

export const MiniQuiz: React.FC<MiniQuizProps> = ({ question, options, correctAnswer }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
  };

  const getButtonClass = (option: string) => {
    if (!answered) {
      return 'bg-white/5 hover:bg-white/10';
    }
    if (option.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
      return 'bg-green-500/80 ring-2 ring-white/50';
    }
    if (option === selected) {
      return 'bg-red-500/80';
    }
    return 'bg-white/5 opacity-60 cursor-not-allowed';
  };

  return (
    <div className="my-6 p-4 bg-black/30 border border-gray-700 rounded-xl">
      <p className="font-semibold text-white mb-3">{question}</p>
      <div className="flex flex-col space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={answered}
            className={`w-full text-left p-3 rounded-lg font-medium text-sm transition-all duration-300 ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {answered && selected?.trim().toLowerCase() !== correctAnswer.trim().toLowerCase() && (
        <p className="mt-3 text-sm text-green-300">
            The correct answer was: <span className="font-bold">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
};