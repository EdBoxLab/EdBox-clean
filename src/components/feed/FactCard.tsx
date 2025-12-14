import React, { useState } from 'react';
import type { FactFeedItem } from '@/types/feed';
import { CardImage } from './CardImage';
import { Lightbulb, Sparkles, BookOpen, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FactCardProps {
    item: FactFeedItem;
}

export const FactCard: React.FC<FactCardProps> = ({ item }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/20" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-xl" />

            {/* Fact Icon Header */}
            <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-2 mb-4"
            >
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/30">
                    <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 font-bold text-sm">DID YOU KNOW?</span>
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
            </motion.div>

            {/* Image */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm mb-4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/20"
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
                className="w-full max-w-md"
            >
                <div className="bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/20">
                    <motion.h2 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg sm:text-xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                    >
                        {item.title}
                    </motion.h2>
                    
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="overflow-hidden"
                    >
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            {item.explanation}
                        </p>
                    </motion.div>

                    {/* Interactive Elements */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-cyan-400 font-medium">FACT</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-full transition-colors"
                                title="Share this fact"
                            >
                                <Share2 className="w-4 h-4 text-cyan-400" />
                            </motion.button>
                            
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-bold">{item.xp_reward} XP</span>
                            </div>
                        </div>
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
