'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, FileText, Clock, Target, Map, Loader2, Info } from 'lucide-react';

export const GeneratingView = () => {
    const studyHacks = [
        { icon: <Brain className="w-5 h-5" />, tip: "The Feynman Technique: Explain a concept to a child to master it." },
        { icon: <Zap className="w-5 h-5" />, tip: "Spaced Repetition: Reviewing at increasing intervals boosts long-term memory." },
        { icon: <FileText className="w-5 h-5" />, tip: "Active Recall: Testing yourself is 2x more effective than re-reading." },
        { icon: <Clock className="w-5 h-5" />, tip: "The Pomodoro Technique: Study for 25 minutes, then take a 5-minute break." },
        { icon: <Target className="w-5 h-5" />, tip: "Eat the Frog: Start your study session with the hardest topic." },
        { icon: <Map className="w-5 h-5" />, tip: "Mind Mapping: Visualizing connections improves recall by up to 15%." }
    ];

    const [hackIndex, setHackIndex] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const statusMessages = [
        "Reading your materials...",
        "Analyzing key concepts...",
        "Generating brain-friendly notes...",
        "Crafting active recall quizzes...",
        "Building your personalized study kit...",
        "Optimizing for maximum retention...",
        "Polishing the final result..."
    ];

    useEffect(() => {
        console.log('🎨 GeneratingView mounted - animations should be visible');
        const hackTimer = setInterval(() => {
            setHackIndex((prev) => (prev + 1) % studyHacks.length);
        }, 5000);

        const statusTimer = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statusMessages.length);
        }, 3500);

        return () => {
            clearInterval(hackTimer);
            clearInterval(statusTimer);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-10 max-w-2xl mx-auto">
            {/* Main Loading Visual */}
            <div className="relative">
                <motion.div
                    className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[60px]"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-6">
                        <Loader2 className="w-full h-full text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-indigo-400 animate-pulse" />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={statusIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
                        >
                            {statusMessages[statusIndex]}
                        </motion.h2>
                    </AnimatePresence>
                    <p className="text-zinc-500 mt-2 text-sm italic">Sit tight, we're doing the heavy lifting...</p>
                </div>
            </div>

            {/* Progress Indicators */}
            <div className="w-full max-w-md space-y-4">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 w-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {statusMessages.slice(0, 4).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className={`w-1.5 h-1.5 rounded-full ${i <= statusIndex ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-zinc-700'}`}></div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold ${i <= statusIndex ? 'text-indigo-400' : 'text-zinc-600'}`}>
                                {i === statusIndex ? 'In Progress' : i < statusIndex ? 'Complete' : 'Pending'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Study Hack Carousel */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Info className="w-12 h-12 text-indigo-500" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Pro Study Hack
                    </span>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={hackIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                                {studyHacks[hackIndex].icon}
                            </div>
                            <p className="text-zinc-300 font-medium leading-relaxed max-w-[320px]">
                                {studyHacks[hackIndex].tip}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-1.5 mt-6">
                        {studyHacks.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-500 ${i === hackIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-zinc-800'}`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
