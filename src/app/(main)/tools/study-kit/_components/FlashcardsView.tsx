'use client';

import React from 'react';
import { Loader2, Crown, Plus } from 'lucide-react';
import { FlashcardItem } from './FlashcardItem';

export const FlashcardsView = ({
    displayContent,
    studyKit,
    isPremium,
    isGeneratingMore,
    handleGenerateMore,
    handleWatchAd
}: any) => {
    let flashcardData = displayContent.flashcards;
    if (!Array.isArray(flashcardData)) {
        if (flashcardData?.flashcards) flashcardData = flashcardData.flashcards;
        else if (flashcardData?.cards) flashcardData = flashcardData.cards;
    }
    
    if (!Array.isArray(flashcardData) || flashcardData.length === 0) {
        return <div className="col-span-full p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">No flashcards available</div>;
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcardData.map((card: any, i: number) => (
                    <FlashcardItem key={i} card={card} />
                ))}
            </div>

            {/* Generate More Flashcards Button - Always Visible */}
            {studyKit && (
                <div className="mt-6 flex justify-center">
                    {isPremium ? (
                        <button
                            onClick={() => handleGenerateMore('flashcards')}
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
                                    Generate 10 More Flashcards
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleWatchAd('flashcards')}
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
                                    Watch Ad for 10 More Flashcards
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
