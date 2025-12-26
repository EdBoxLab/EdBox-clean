import React, { useState } from 'react';
import type { FactFeedItem } from '@/types/feed';
import { CardImage } from './CardImage';
import { Lightbulb, Sparkles, BookOpen, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FactCardProps {
    item: FactFeedItem;
    isActive: boolean;
}

export const FactCard: React.FC<FactCardProps> = ({ item, isActive }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-transparent">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.15),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_70%)]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

            {/* Fact Icon Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <Lightbulb className="w-6 h-6 text-cyan-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] block mb-0.5">Did You Know?</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Daily Insight</h3>
                </div>
            </motion.div>

            {/* Image */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-8 rounded-2xl overflow-hidden shadow-2xl z-10 border border-white/10 relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent z-10" />
                <CardImage
                    generationState={item.imageGenerationState}
                    imageUrl={item.imageUrl}
                    altText={item.title}
                />
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                        <p className="text-white/90 text-base sm:text-lg lg:text-xl leading-relaxed font-medium tracking-tight">
                            {item.explanation || (item as any).content || (item as any).fact || "Fascinating educational insight coming your way..."}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10 flex items-center gap-4 z-10"
            >
                <div className="h-px w-8 bg-cyan-500/20" />
                <Sparkles className="w-4 h-4 text-cyan-500/40 animate-pulse" />
                <div className="h-px w-8 bg-cyan-500/20" />
            </motion.div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-cyan-500/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-20, 20],
                            opacity: [0, 0.4, 0],
                            scale: [1, 2, 1],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
