'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Crown, Plus } from 'lucide-react';

export const QuizzesView = ({
    displayContent,
    currentQuizStates,
    setCurrentQuizStates,
    score,
    setScore,
    studyKit,
    isPremium,
    isGeneratingMore,
    handleGenerateMore,
    handleWatchAd
}: any) => {
    const handleOptionSelect = (quizIndex: number, optionIndex: number) => {
        if (currentQuizStates[quizIndex]?.isConfirmed) return;

        const newStates = [...currentQuizStates];
        newStates[quizIndex] = { ...newStates[quizIndex], selectedOption: optionIndex };
        setCurrentQuizStates(newStates);
    };

    const handleConfirm = (quizIndex: number) => {
        const newStates = [...currentQuizStates];
        newStates[quizIndex] = { ...newStates[quizIndex], isConfirmed: true };
        setCurrentQuizStates(newStates);

        // Update score if all are confirmed
        if (newStates.every((s: any) => s.isConfirmed)) {
            const correctCount = newStates.reduce((acc: number, s: any, idx: number) => {
                return acc + (s.selectedOption === displayContent.quizzes[idx].correctAnswer ? 1 : 0);
            }, 0);
            setScore({ correct: correctCount, total: displayContent.quizzes.length });
        }
    };

    let quizData = displayContent.quizzes;
    if (!Array.isArray(quizData) && quizData.questions) quizData = quizData.questions;
    if (!Array.isArray(quizData) || quizData.length === 0) return <div className="p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">No quizzes available</div>;

    return (
        <div className="grid gap-6">
            {score && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-600 rounded-xl p-6 text-center mb-6"
                >
                    <h4 className="text-2xl font-bold mb-2">Quiz Complete!</h4>
                    <p className="text-indigo-100 text-lg">Your Score: {score.correct} / {score.total} ({Math.round((score.correct / score.total) * 100)}%)</p>
                </motion.div>
            )}
            {quizData.map((quiz: any, i: number) => {
                const state = currentQuizStates[i];
                const isCorrect = state?.selectedOption === quiz.correctAnswer;
                const showExplanation = state?.isConfirmed;

                return (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg flex gap-3">
                                <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                    {i + 1}
                                </span>
                                {quiz.question}
                            </h3>
                            {quiz.difficulty && (
                                <span className={`text-xs px-2 py-1 rounded-full ${quiz.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400' :
                                    quiz.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-green-500/10 text-green-400'
                                    }`}>
                                    {quiz.difficulty}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 pl-11">
                            {quiz.options?.map((opt: string, optIndex: number) => {
                                const isSelected = state?.selectedOption === optIndex;
                                const isAnswer = optIndex === quiz.correctAnswer;

                                let borderColor = 'border-zinc-800';
                                let bgColor = 'bg-zinc-950/50';

                                if (state?.isConfirmed) {
                                    if (isAnswer) {
                                        borderColor = 'border-green-500';
                                        bgColor = 'bg-green-500/10';
                                    } else if (isSelected && !isCorrect) {
                                        borderColor = 'border-red-500';
                                        bgColor = 'bg-red-500/10';
                                    }
                                } else if (isSelected) {
                                    borderColor = 'border-indigo-500';
                                    bgColor = 'bg-indigo-500/10';
                                }

                                return (
                                    <button
                                        key={optIndex}
                                        disabled={state?.isConfirmed}
                                        onClick={() => handleOptionSelect(i, optIndex)}
                                        className={`w-full text-left p-3 rounded-lg border transition ${borderColor} ${bgColor} ${!state?.isConfirmed && 'hover:border-zinc-600'}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                            {!state?.isConfirmed && state?.selectedOption !== null && (
                                <button
                                    onClick={() => handleConfirm(i)}
                                    className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition"
                                >
                                    Check Answer
                                </button>
                            )}
                            {showExplanation && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 p-4 bg-zinc-800/50 rounded-lg text-sm border-l-4 border-indigo-500"
                                >
                                    <p className="font-bold text-indigo-400 mb-1">Explanation:</p>
                                    <p className="text-zinc-300">{quiz.explanation}</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Generate More Quizzes Button - Always Visible */}
            {studyKit && (
                <div className="mt-6 flex justify-center">
                    {isPremium ? (
                        <button
                            onClick={() => handleGenerateMore('quizzes')}
                            disabled={isGeneratingMore}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            {isGeneratingMore ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Crown className="w-4 h-4" />
                                    <Plus className="w-4 h-4" />
                                    Generate 10 More Quizzes
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleWatchAd('quizzes')}
                            disabled={isGeneratingMore}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                        >
                            {isGeneratingMore ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Watch Ad for 10 More Quizzes
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
