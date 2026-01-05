'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';

export const HeroSection = () => {
    return (
        <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#8B5CF6]/20 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50 mix-blend-screen" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-30" />

            <div className="max-w-5xl mx-auto text-center relative z-10">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
                >
                    <span className="flex h-2 w-2 rounded-full bg-[#8B5CF6] animate-pulse"></span>
                    <span className="text-xs font-medium text-[#D1D5DB] tracking-wide">EDBOX 2.0 IS LIVE</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]"
                >
                    Your personal <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">learning engine.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                    I built EdBox because I was tired of juggling 4 apps just to study for one exam.
                    Generate courses, quizzes, and flashcards in seconds.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/signup"
                        className="h-12 px-8 rounded-full bg-[#F3F4F6] text-black font-semibold text-sm flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105"
                    >
                        Start Learning Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button className="h-12 px-8 rounded-full border border-white/10 bg-white/5 text-[#F3F4F6] font-semibold text-sm flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-sm group">
                        <Play className="w-4 h-4 fill-current opacity-60 group-hover:opacity-100 transition-opacity" />
                        Watch the Video
                    </button>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
                <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            </motion.div>
        </section>
    );
};
