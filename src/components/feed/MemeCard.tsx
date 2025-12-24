import React from 'react';
import type { MemeFeedItem } from '@/types/feed';
import { CardImage } from './CardImage';
import { motion } from 'framer-motion';
import { Sparkles, Laugh } from 'lucide-react';

interface MemeCardProps {
    item: MemeFeedItem;
}

export const MemeCard: React.FC<MemeCardProps> = ({ item }) => {
    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-slate-950">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(234,179,8,0.1),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.05),transparent_70%)]" />

            {/* Meme Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <Laugh className="w-6 h-6 text-yellow-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] block mb-0.5">Brain Break</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">EduMeme</h3>
                </div>
            </motion.div>

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black border border-white/10 z-10"
            >
                {/* Image Container */}
                <div className="relative w-full aspect-square">
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />

                    {/* Meme Overlays */}
                    {item.imageGenerationState === 'ready' && (
                        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase text-stroke-black drop-shadow-2xl text-center leading-tight tracking-tight">
                                {item.top_text}
                            </h2>
                            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase text-stroke-black drop-shadow-2xl text-center leading-tight tracking-tight">
                                {item.bottom_text}
                            </h2>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Concept Context */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-10 max-w-sm w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl z-10"
            >
                <div className="flex items-center justify-center gap-2 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Learning Concept</span>
                </div>
                <p className="font-bold text-lg text-white tracking-tight">{item.concept}</p>
            </motion.div>

            {/* Styles for meme text outline */}
            <style>{`
                .text-stroke-black {
                    -webkit-text-stroke: 1.5px black;
                    text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
                }
            `}</style>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-yellow-500/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-20, 20],
                            opacity: [0, 0.3, 0],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
