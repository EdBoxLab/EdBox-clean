'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, X } from 'lucide-react';
import Link from 'next/link';
import { GenieIcon } from '../GenieIcon';

export const HeroSection = () => {
    const [showDemo, setShowDemo] = useState(false);

    return (
        <section className="relative pt-48 pb-40 px-6 overflow-hidden min-h-screen flex flex-col justify-center bg-[#050505]">

            {/* 1. Fluid Background Layer */}
            <div className="absolute inset-x-0 top-0 h-[1000px] pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        rotate: [0, 10, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#8B5CF6]/10 blur-[180px] rounded-full mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, -40, 0],
                        y: [0, 60, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[10%] -right-[5%] w-[60%] h-[60%] bg-indigo-500/10 blur-[160px] rounded-full mix-blend-screen"
                />
            </div>

            {/* 2. Technical HUD Grid Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf612_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf612_1px,transparent_1px)] bg-[size:200px_200px]"
                />
            </div>

            <div className="max-w-7xl mx-auto text-center relative z-10">

                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-4 mb-12"
                >
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]"
                    />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Your AI Study Partner</span>
                </motion.div>

                {/* Alive Main Headline */}
                <div className="relative mb-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-7xl md:text-9xl font-black tracking-tight text-white leading-[0.9] text-balance"
                    >
                        Master anything, <br />
                        <span className="relative">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#8B5CF6] to-white/40 selection:bg-[#8B5CF6]">
                                faster.
                            </span>
                            {/* Energy Line Underneath */}
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: '100%', opacity: 1 }}
                                transition={{ delay: 1, duration: 1.5, ease: "circOut" }}
                                className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_15px_#8B5CF6]"
                            />
                        </span>
                    </motion.h1>
                </div>

                {/* Alive Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    className="text-xl md:text-2xl text-zinc-500 max-w-3xl mx-auto mb-16 leading-relaxed font-medium text-balance"
                >
                    Studying doesn't have to be boring. EdBox is the <span className="text-white">smart study tool</span> that helps you learn.
                    Join 100+ pioneers building the future of education.
                </motion.p>

                {/* Kinetic CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        href="/signup"
                        className="h-16 px-12 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_30px_60px_-15px_rgba(255,255,255,0.2)] group"
                    >
                        Start Learning Free
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
                    </Link>

                    <button
                        onClick={() => setShowDemo(true)}
                        className="h-16 px-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-white/[0.05] transition-all backdrop-blur-3xl group"
                    >
                        <div className="w-2 h-2 rounded-full bg-indigo-100 group-hover:animate-ping" />
                        Watch Demo
                    </button>
                </motion.div>

                {/* The "Neural Core" Visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 1.5, type: "spring" }}
                    className="mt-32 relative flex justify-center"
                >
                    {/* Pulsing Aura */}
                    <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[#8B5CF6]/30 blur-[100px] rounded-full -z-10"
                    />
                    <div className="relative group cursor-none">
                        <GenieIcon className="w-48 h-48 md:w-64 md:h-64 text-white drop-shadow-[0_0_30px_#8B5CF666] group-hover:scale-105 transition-transform duration-1000" />

                        {/* Orbiting Data Points */}
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    rotate: { duration: 10 + i * 5, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i }
                                }}
                                className="absolute border border-white/5 rounded-full"
                                style={{
                                    inset: -30 - i * 20,
                                    borderStyle: i % 2 === 0 ? 'dashed' : 'solid'
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

            </div>

            {/* Simple Pioneer Milestone */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-12 text-center"
            >
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                    Trusted by <span className="text-white">100+ Pioneers</span>
                </span>
            </motion.div>

            {/* Fullscreen Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-3xl"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, rotateX: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            exit={{ scale: 0.95, opacity: 0, rotateX: 20 }}
                            className="relative w-full max-w-[1400px] aspect-video bg-[#0A0A0A] rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(139,92,246,0.3)]"
                        >
                            <button
                                onClick={() => setShowDemo(false)}
                                className="absolute top-8 right-8 z-50 p-4 rounded-full bg-white text-black hover:scale-110 active:scale-90 transition-all shadow-2xl"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <iframe
                                src="https://app.supademo.com/embed/cmk8ftj4b0crhke4xxae6gdup?embed_v=2&utm_source=embed&autoplay=1&loop=1"
                                className="w-full h-full"
                                style={{ border: 0 }}
                                title="EdBox Technical Flow"
                                allow="clipboard-write; fullscreen"
                                allowFullScreen
                            />
                        </motion.div>
                        <div className="absolute inset-0 -z-10" onClick={() => setShowDemo(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
