'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const FlashcardItem = ({ card }: { card: any }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);

    return (
        <div className="h-80 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="relative w-full h-full"
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' } as React.CSSProperties}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-zinc-950 border border-zinc-800 group-hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl transition-colors overflow-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Front</div>
                    <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-2 py-6 flex items-center justify-center">
                        <p className="font-bold text-xl text-white leading-tight break-words">{card.front}</p>
                    </div>
                    {card.hint && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center" onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}>
                            <p className={`text-xs px-3 py-1.5 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-full transition-all hover:bg-zinc-700 ${showHint ? 'text-indigo-300' : 'text-zinc-500'}`}>
                                {showHint ? card.hint : 'Tap for hint'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-indigo-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Back</div>
                    <div className="w-full max-h-full overflow-y-auto custom-scrollbar px-2 py-6 flex items-center justify-center">
                        <p className="font-medium text-lg text-indigo-50 leading-relaxed break-words">{card.back}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
