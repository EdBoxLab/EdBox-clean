'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MediaFeedItem, Feedback } from '@/types/feed';

interface MediaCardProps {
    item: MediaFeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    onFeedback: (id: string, feedback: Feedback) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, isActive, onSwipe, onFeedback }) => {
    return (
        <div className="absolute inset-0 flex flex-col justify-end px-8 sm:px-12 pt-8 sm:pt-12 pb-48 sm:pb-36 z-30 pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                className="max-w-2xl pointer-events-auto"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                            className="px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[11px] font-black text-white uppercase tracking-[0.25em] shadow-2xl"
                        >
                            {item.topic}
                        </motion.span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tighter drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                        {item.headline}
                    </h2>

                    <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-medium">
                        {item.body}
                    </p>

                    {item.source && (
                        <div className="flex items-center gap-3 text-white/50 pt-2">
                            <div className="w-10 h-[1px] bg-white/20" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                                {item.source}
                            </span>
                        </div>
                    )}

                    <div className="pt-8">
                        <button
                            onClick={() => onSwipe(item.id, 'got_it', item.xp_reward)}
                            className="group relative px-10 py-4 bg-white text-black rounded-2xl font-black text-sm transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95 flex items-center gap-3"
                        >
                            GOT IT! +{item.xp_reward}XP
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
