'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';

interface WarmUpStep {
    prompt: string;
    options?: string[];
    correctAnswer: string;
}

interface WarmUpViewProps {
    description: string;
    steps: WarmUpStep[];
    onComplete: () => void;
}

export default function WarmUpView({ description, steps, onComplete }: WarmUpViewProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const currentStep = steps[currentStepIndex];

    const handleOptionSelect = (option: string) => {
        if (isCorrect === true) return;

        setSelectedOption(option);
        const correct = option.toLowerCase() === currentStep.correctAnswer.toLowerCase();
        setIsCorrect(correct);

        if (!correct) {
            // Auto-reset after a short delay for wrong answers to allow retry
            setTimeout(() => {
                setIsCorrect(null);
                setSelectedOption(null);
            }, 1500);
        }
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            onComplete();
        }
    };

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto py-4 md:py-8">
            {/* Concept Introduction */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 md:mb-12 text-center"
            >
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                        <Lightbulb className="w-3.5 h-3.5" />
                        Warm Up
                    </div>
                    <button
                        onClick={onComplete}
                        className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                    >
                        SKIP →
                    </button>
                </div>
                <h2 className="text-xl md:text-3xl font-bold mb-2 p-2">{description}</h2>
            </motion.div>

            {/* Interactive Step */}
            <div className="flex-1 px-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 md:space-y-8"
                    >
                        <div className={`bg-gray-900 border transition-colors rounded-3xl p-6 md:p-8 shadow-xl ${isCorrect === false ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800'
                            }`}>
                            <h3 className="text-lg md:text-2xl text-center font-medium leading-relaxed">
                                {currentStep.prompt.split('___').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className={`inline-block min-w-[100px] border-b-2 mx-1 px-2 transition-colors ${isCorrect === true ? 'border-green-500 text-green-400' :
                                                    isCorrect === false ? 'border-red-500 text-red-400 animate-pulse' : 'border-indigo-500 text-indigo-500'
                                                }`}>
                                                {selectedOption || '____'}
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            {currentStep.options?.map((option) => (
                                <motion.button
                                    key={option}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOptionSelect(option || 'Option')}
                                    className={`p-4 md:p-5 rounded-2xl text-base md:text-lg font-semibold border-2 transition-all ${selectedOption === option
                                            ? isCorrect === true
                                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                                : isCorrect === false
                                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                                    : 'bg-gray-900 border-gray-800 text-gray-300'
                                            : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300'
                                        }`}
                                >
                                    {option || 'Option'}
                                </motion.button>
                            ))}
                        </div>

                        {/* Hint message for wrong answer */}
                        <AnimatePresence>
                            {isCorrect === false && (
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center text-red-400 text-sm font-bold"
                                >
                                    Not quite! Try another one.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Action */}
            <footer className="mt-auto pt-6 md:pt-8 flex justify-center px-4">
                <AnimatePresence>
                    {isCorrect === true && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={nextStep}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all"
                        >
                            <span>{currentStepIndex < steps.length - 1 ? 'Continue' : 'Start Challenge'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </footer>
        </div>
    );
}
