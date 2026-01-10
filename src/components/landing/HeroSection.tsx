'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Users, Star, X } from 'lucide-react';
import Link from 'next/link';

export const HeroSection = () => {
    const [showDemo, setShowDemo] = useState(false);

    // Close modal on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowDemo(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-screen flex flex-col justify-center">
            {/* Clean Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#8B5CF6]/20 blur-[120px] rounded-full pointer-events-none -z-10 opacity-50 mix-blend-screen" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-30" />

            <div className="max-w-5xl mx-auto text-center relative z-10">

                {/* Launch Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 backdrop-blur-sm mb-8 shadow-lg shadow-[#8B5CF6]/20"
                >
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[#8B5CF6] animate-pulse"></span>
                    <span className="text-sm font-semibold text-white tracking-wide">REAL LEARNING ONLY</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]"
                >
                    Stop watching. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#3B82F6]">
                        Start doing.
                    </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg md:text-xl text-[#9CA3AF] max-w-3xl mx-auto mb-8 leading-relaxed"
                >
                    I built EdBox because watching tutorials taught me nothing and I hate juggling different apps just to learn something.
                    Now you learn by actually doing—write code, solve problems, build projects.
                    <span className="text-white font-medium"> No more passive watching.</span>
                </motion.p>

                {/* Social Proof */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
                    className="flex items-center justify-center gap-6 mb-12"
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#8B5CF6]" />
                        <span className="text-sm text-[#D1D5DB]">
                            <span className="font-semibold text-white">1,000+</span> students learning
                        </span>
                    </div>
                    <div className="w-1 h-4 bg-white/10 rounded-full"></div>
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#8B5CF6] text-[#8B5CF6]" />
                            ))}
                        </div>
                        <span className="text-sm text-[#D1D5DB]">
                            <span className="font-semibold text-white">4.8/5</span> from early users
                        </span>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/signup"
                        className="h-12 px-8 rounded-full bg-[#8B5CF6] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[#7C3AED] transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20"
                    >
                        Start Learning Free
                        <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button
                        onClick={() => setShowDemo(true)}
                        className="h-12 px-8 rounded-full border border-white/10 bg-white/5 text-[#F3F4F6] font-semibold text-sm flex items-center gap-2 hover:bg-white/10 transition-all backdrop-blur-sm group"
                    >
                        <Play className="w-4 h-4 fill-current opacity-60 group-hover:opacity-100 transition-opacity" />
                        Try Demo
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-6 text-sm text-[#6B7280]"
                >
                    No credit card required • Free forever • 5 minutes to first course
                </motion.p>
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

            {/* Interactive Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-6xl aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.3)]"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowDemo(false)}
                                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black transition-all backdrop-blur-md border border-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Demo Iframe - FIXED */}
                            <iframe
                                src="https://app.supademo.com/embed/cmk8ftj4b0crhke4xxae6gdup?embed_v=2&utm_source=embed&autoplay=1&loop=1"
                                className="w-full h-full"
                                style={{ border: 0 }}
                                loading="lazy"
                                title="EdBox Interactive Demo"
                                allow="clipboard-write; fullscreen"
                                allowFullScreen
                            />
                        </motion.div>

                        {/* Direct Background click to close */}
                        <div
                            className="absolute inset-0 -z-10 cursor-zoom-out"
                            onClick={() => setShowDemo(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};