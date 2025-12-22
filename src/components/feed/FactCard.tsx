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
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-2 sm:px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/20" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan-500/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-xl" />

            {/* Fact Icon Header */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-1 sm:gap-2 mb-3 sm:mb-4"
            >
                <div className="p-2 sm:p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/30">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 font-bold text-xs sm:text-sm">DID YOU KNOW?</span>
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
            </motion.div>

            {/* Image */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-[280px] sm:max-w-sm mb-3 sm:mb-4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/20"
            >
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
                className="w-full max-w-sm sm:max-w-md z-10"
            >
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-cyan-500/30 shadow-xl">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <p className="text-gray-100 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
                            {item.explanation || (item as any).content || (item as any).fact || "Fascinating educational insight coming your way..."}
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 3) * 20}%`,
                        }}
                        animate={{
                            y: [-10, 10, -10],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
