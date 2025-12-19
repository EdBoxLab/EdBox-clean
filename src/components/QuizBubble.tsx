'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, Sparkles } from 'lucide-react';

interface QuizBubbleProps {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    onAnswer: (answer: string, isCorrect: boolean) => void;
    answered?: string;
    isCorrect?: boolean;
}

export default function QuizBubble({
    question,
    options,
    correctAnswer,
    explanation,
    onAnswer,
    answered: initialAnswered,
    isCorrect: initialIsCorrect
}: QuizBubbleProps) {
    const [selected, setSelected] = useState<string | null>(initialAnswered || null);
    const [showExplanation, setShowExplanation] = useState(!!initialAnswered);

    const handleSelect = (option: string) => {
        if (selected) return;

        const isCorrect = option === correctAnswer;
        setSelected(option);
        setShowExplanation(true);
        onAnswer(option, isCorrect);
    };

    return (
        <div className="w-full max-w-sm mt-4 space-y-4">
            <div className="p-5 bg-gray-800/40 border border-gray-700/50 rounded-2xl backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick Check</span>
                </div>

                <h3 className="text-gray-100 font-semibold mb-6 leading-relaxed">
                    {question}
                </h3>

                <div className="space-y-2">
                    {options.map((option) => {
                        const isSelected = selected === option;
                        const isCorrectOption = option === correctAnswer;
                        const showCorrect = selected && isCorrectOption;
                        const showWrong = selected && isSelected && !isCorrectOption;

                        return (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                disabled={!!selected}
                                className={`
                  w-full p-3.5 rounded-xl text-left text-sm font-medium transition-all duration-300 flex items-center justify-between group
                  ${!selected
                                        ? 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600 hover:translate-x-1'
                                        : isSelected
                                            ? isCorrectOption
                                                ? 'bg-green-500/20 border border-green-500/40 text-green-200'
                                                : 'bg-red-500/20 border border-red-500/40 text-red-200'
                                            : isCorrectOption
                                                ? 'bg-green-500/20 border border-green-500/40 text-green-200'
                                                : 'bg-gray-800/30 border border-gray-700/30 text-gray-500 opacity-60'
                                    }
                `}
                            >
                                <span>{option}</span>
                                {showCorrect && <Check className="w-4 h-4 text-green-400" />}
                                {showWrong && <X className="w-4 h-4 text-red-400" />}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {showExplanation && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-gray-700/50"
                        >
                            <div className="flex gap-3">
                                <div className={`p-1 mt-0.5 rounded-md ${selected === correctAnswer ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    <Info className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-1 ${selected === correctAnswer ? 'text-green-400' : 'text-blue-400'}`}>
                                        {selected === correctAnswer ? "Genie's Confirmation" : "Learning Moment"}
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {explanation}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
