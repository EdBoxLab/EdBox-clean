import React, { useState } from 'react';
import type { StoryFeedItem } from '@/types/feed';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Trophy, Sparkles } from 'lucide-react';

interface StoryCardProps {
    item: StoryFeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'got_it' | 'answered', xp?: number) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ item, isActive, onSwipe }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const totalSlides = item.slides.length;
    const isLastSlide = currentSlide === totalSlides - 1;

    const handleNext = () => {
        if (isLastSlide) {
            onSwipe(item.id, 'got_it', item.xp_reward);
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    const slide = item.slides[currentSlide];
    const slideText = typeof slide === 'string' ? slide : slide.text;

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-slate-950">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.15),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1),transparent_70%)]" />

            {/* Progress Bars (Top) */}
            <div className="absolute top-6 left-6 right-6 flex gap-1.5 z-30">
                {item.slides.map((_, index) => (
                    <div key={index} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={false}
                            animate={{
                                width: index <= currentSlide ? '100%' : '0%',
                                opacity: index <= currentSlide ? 1 : 0
                            }}
                            className={`h-full ${index === currentSlide ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/40'}`}
                        />
                    </div>
                ))}
            </div>

            {/* Story Icon Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 z-10 mt-4"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <BookOpen className="w-6 h-6 text-purple-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] block mb-0.5">Quick Story</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Daily Tale</h3>
                </div>
            </motion.div>

            {/* Slide Content Container */}
            <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-auto sm:min-h-[400px] flex items-center justify-center z-20 group">
                {/* Navigation Overlays */}
                <div
                    className="absolute left-0 top-0 h-full w-1/3 z-30 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                />
                <div
                    className="absolute right-0 top-0 h-full w-2/3 z-30 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                />

                {/* Content Box */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
                    >
                        {/* Inner Gradient Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

                        <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed tracking-tight select-none relative z-10">
                            {slideText}
                        </p>

                        {/* Slide Indicator (Center Bottom) */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                Slide {currentSlide + 1} of {totalSlides}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Hints */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/5 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10 pointer-events-none">
                    <ChevronLeft className="w-5 h-5 text-white/60" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/5 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all border border-white/10 pointer-events-none">
                    {isLastSlide ? <Trophy className="w-5 h-5 text-purple-400 animate-bounce" /> : <ChevronRight className="w-5 h-5 text-white/60" />}
                </div>
            </div>

            {/* Footer Status */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex items-center gap-6 z-10"
            >
                <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-white/60 tabular-nums tracking-wide">
                        {isLastSlide ? 'TAP TO FINISH!' : 'TAP TO CONTINUE'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Live Session</span>
                </div>
            </motion.div>

            {/* Animated particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-purple-500/30 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-30, 30],
                            x: [-10, 10],
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
