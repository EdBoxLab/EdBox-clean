'use client';

import React from 'react';
import { Check, Library, Loader2, Trash2 } from 'lucide-react';
import { contentTypes } from '../constants';

export const MenuStage = ({
    multiSelectedTypes,
    toggleContentType,
    setCurrentStep,
    isLoadingKits,
    studyKits,
    handleDeleteStudyKit
}: any) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">What would you like to create?</h2>
                <p className="text-zinc-400">Select one or more tools for your study kit</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = multiSelectedTypes.includes(type.id);
                    return (
                        <button
                            key={type.id}
                            onClick={() => toggleContentType(type.id)}
                            className={`group p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                                ? 'border-indigo-500 bg-indigo-500/5'
                                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">{type.label}</h3>
                                        <p className="text-zinc-400 text-sm">{type.description}</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'
                                    }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={() => setCurrentStep('options')}
                    disabled={multiSelectedTypes.length === 0}
                    className="px-12 py-4 bg-zinc-800 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-bold transition-all"
                >
                    Continue to Setup
                </button>
            </div>

            {/* My Study Kits List (Secondary) */}
            <div className="mt-12">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Library className="w-5 h-5 text-indigo-400" />
                    Recent Study Kits
                </h3>
                {isLoadingKits ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : studyKits.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                        No kits yet. Create your first one above!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studyKits.slice(0, 4).map((kit: any) => (
                            <div
                                key={kit.id}
                                className="group relative p-4 bg-zinc-800/30 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all cursor-pointer"
                                onClick={() => window.location.href = `/tools/study-kit?id=${kit.id}`}
                            >
                                <div className="pr-10">
                                    <h4 className="font-semibold text-white truncate">{kit.title}</h4>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {new Date(kit.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteStudyKit(e, kit.id)}
                                    className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
