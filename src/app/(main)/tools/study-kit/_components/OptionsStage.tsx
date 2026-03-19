'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const OptionsStage = ({
    multiSelectedTypes,
    countOption,
    setCountOption,
    depthOption,
    setDepthOption,
    setCurrentStep
}: any) => {
    const types = multiSelectedTypes;
    const hasQuizzes = types.includes('quizzes');
    const hasFlashcards = types.includes('flashcards');
    const hasNotes = types.includes('notes');
    const hasMindMap = types.includes('mindmaps');

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
                <button onClick={() => setCurrentStep('menu')} className="text-zinc-500 hover:text-white flex items-center gap-2 mx-auto mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Selection
                </button>
                <h2 className="text-3xl font-bold">Configure Your Kit</h2>
                <p className="text-zinc-400">Set preferences for your selected tools</p>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
                {/* Count Options for Quizzes/Flashcards */}
                {(hasQuizzes || hasFlashcards) && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-4 text-center uppercase tracking-widest">
                            Item Count (for Quizzes & Flashcards)
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {[10, 20, 30, 40, 50].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setCountOption(num)}
                                    className={`py-4 rounded-xl border-2 transition-all font-bold ${countOption === num
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                        : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Depth Options for Notes */}
                {hasNotes && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-4 text-center uppercase tracking-widest">Select Notes Depth</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'summary', name: 'Summary', desc: 'High-level overview' },
                                { id: 'deepdive', name: 'Deep Dive', desc: 'Detailed explanations' },
                                { id: 'coverage', name: 'Coverage', desc: 'Balanced breadth & depth' },
                                { id: 'shi', name: 'Shi', desc: 'Experimental & Creative' }
                            ].map((depth: any) => (
                                <button
                                    key={depth.id}
                                    onClick={() => setDepthOption(depth.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${depthOption === depth.id
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold ${depthOption === depth.id ? 'text-indigo-400' : 'text-white'}`}>{depth.name}</span>
                                        {depthOption === depth.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                    <p className="text-xs text-zinc-500">{depth.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hasMindMap && !hasQuizzes && !hasFlashcards && !hasNotes && (
                    <div className="text-center py-4">
                        <p className="text-zinc-400">Mind maps generate a single interactive visualization.</p>
                    </div>
                )}

                <div className="pt-4">
                    <button
                        onClick={() => setCurrentStep('confirm')}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};
