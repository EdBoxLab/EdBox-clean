'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppWindow } from './AppWindow';
import { Book, MessageCircle, ChevronRight, Check, LayoutGrid, Wand2, ArrowRight } from 'lucide-react';
import { GenieIcon } from '../GenieIcon';
import Link from 'next/link';

export const ProductShowcase = () => {
    return (
        <section id="features" className="py-40 px-6 bg-[#050505] relative overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute top-[20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-500/5 blur-[200px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-[-10%] w-[800px] h-[800px] bg-[#8B5CF6]/5 blur-[180px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto">

                {/* Section Header: Alive Entrance */}
                <div className="text-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex items-center justify-center gap-4 mb-12"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]"
                        />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Smart Tools</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter"
                    >
                        Faster Study <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-indigo-400">Tools.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-zinc-500 max-w-3xl mx-auto font-medium leading-relaxed"
                    >
                        We built a <span className="text-white">simple system</span> that learns with you and helps you master any topic in half the time.
                    </motion.p>
                </div>

                {/* The "Alive" Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[240px]">

                    {/* 1. Genie AI: The Core (Large) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="md:col-span-6 lg:col-span-8 row-span-2 relative group flex flex-col"
                    >
                        <div className="absolute inset-0 bg-[#8B5CF6]/10 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-[80px] rounded-[48px] -z-10" />
                        <div className="h-full bg-zinc-900/40 border border-white/[0.05] rounded-[40px] p-10 flex flex-col md:flex-row gap-12 overflow-hidden backdrop-blur-3xl group-hover:border-[#8B5CF6]/30 transition-colors relative">

                            {/* Technical HUD Overlay */}
                            <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-1 opacity-20 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                <span>AI Assistant active</span>
                                <span>Ready to help</span>
                                <div className="w-16 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                    <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="w-1/2 h-full bg-[#8B5CF6]" />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-8 relative">
                                    <GenieIcon className="w-10 h-10 text-white animate-pulse" />
                                    <motion.div
                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-[#8B5CF6] rounded-[24px]"
                                    />
                                </div>
                                <h3 className="text-4xl font-black text-white mb-6">Genie AI Assistant</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                                    Your AI study partner. It makes hard topics easy to understand and helps you remember what you learn.
                                </p>
                            </div>

                            {/* Internal Animation: Data Stream */}
                            <div className="flex-1 min-h-[300px] bg-black/40 rounded-[32px] border border-white/[0.05] p-8 flex flex-col gap-6 relative overflow-hidden">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thinking...</span>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        "Making topics simple",
                                        "Finding key ideas",
                                        "Creating examples"
                                    ].map((text, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.2 }}
                                            className="h-10 px-4 bg-white/[0.03] rounded-xl flex items-center gap-3 border border-white/[0.02]"
                                        >
                                            <Wand2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                                            <span className="text-xs font-medium text-zinc-400">{text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                {/* Glow Ripple */}
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#8B5CF6]/20 blur-3xl -z-10" />
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Course Generator (High Impact) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-6 lg:col-span-4 row-span-2 relative group"
                    >
                        <div className="h-full bg-zinc-900/40 border border-white/[0.05] rounded-[40px] p-10 flex flex-col justify-between backdrop-blur-3xl group-hover:border-indigo-500/30 transition-colors relative overflow-hidden">

                            {/* Dynamic Background Symbol */}
                            <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wand2 className="w-48 h-48 text-indigo-400 rotate-12" />
                            </div>

                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    <Wand2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-black text-white mb-4 leading-tight">Instant Courses</h3>
                                <p className="text-zinc-500 font-medium leading-relaxed">
                                    Drop a PDF, Link, or Topic. Watch EdBox build a full course in seconds.
                                </p>
                            </div>

                            {/* Alive Progress Visualization */}
                            <div className="mt-16 relative">
                                <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">
                                    <span>Building Course</span>
                                    <span>89%</span>
                                </div>
                                <div className="h-3 w-full bg-black/40 rounded-full p-1 overflow-hidden border border-white/[0.02]">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-[#8B5CF6] rounded-full"
                                        animate={{ width: ['0%', '89%'] }}
                                        transition={{ duration: 3, ease: "circOut" }}
                                    />
                                </div>
                                <div className="mt-6 flex flex-wrap gap-2">
                                    {['Nodes', 'Flow', 'Edge Cases'].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. Smart Feed (Interactive Small) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-3 lg:col-span-6 relative group"
                    >
                        <div className="h-full bg-zinc-900/40 border border-white/[0.05] rounded-[40px] p-8 flex items-center gap-8 backdrop-blur-3xl group-hover:border-zinc-500/30 transition-colors overflow-hidden">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">No Distractions</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                                    A feed built for learning. No ads, just the things you want to study.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 4. Notes (Interactive Small) */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-3 lg:col-span-6 relative group"
                    >
                        <div className="h-full bg-zinc-900/40 border border-white/[0.05] rounded-[40px] p-8 flex items-center gap-8 backdrop-blur-3xl group-hover:border-zinc-500/30 transition-colors overflow-hidden">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shrink-0 relative">
                                <Book className="w-6 h-6 text-zinc-400" />
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full blur-[2px]"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">Connected Notes</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                                    Notes that automatically link your ideas. Build a library of knowledge that works for you.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* Secondary CTA: Alive Transition */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="mt-32 text-center"
                >
                    <Link
                        href="/signup"
                        className="inline-flex flex-col items-center gap-6 group"
                    >
                        <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] group-hover:bg-white/[0.05] transition-all group-hover:scale-105 active:scale-95">
                            <span className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400 group-hover:text-white transition-colors">Start Studying Better</span>
                            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all group-hover:translate-x-1" />
                        </div>
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] opacity-50 group-hover:opacity-100 transition-opacity">
                            Join 100+ students already learning
                        </div>
                    </Link>
                </motion.div>

            </div>
        </section>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${active
            ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25'
            : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
            }`}
    >
        {icon}
        {label}
    </button>
);

// --- MOCKUPS ---

const StudyKitMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 p-8 flex flex-col items-center justify-center">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            {/* Flashcards */}
            <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 hover:border-[#8B5CF6]/50 transition-colors group cursor-pointer h-64 flex flex-col justify-between">
                <div>
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 text-xl">⚡</div>
                    <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                    <p className="text-gray-400 text-sm">Master concepts with spaced repetition.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                    24 Cards Due <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            </div>

            {/* Quiz */}
            <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 hover:border-[#8B5CF6]/50 transition-colors group cursor-pointer h-64 flex flex-col justify-between">
                <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 text-xl">📝</div>
                    <h3 className="text-xl font-bold text-white mb-2">Practice Quiz</h3>
                    <p className="text-gray-400 text-sm">Test your knowledge with AI-generated questions.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                    Start Session <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const NotesMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 flex">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full h-full"
        >
            {/* Notes Sidebar */}
            <div className="w-64 border-r border-white/5 bg-[#0A0A0A] p-4 hidden md:flex flex-col gap-2">
                <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-sm font-bold text-gray-400">FOLDERS</span>
                </div>
                {[
                    { name: 'Biology 101', active: true },
                    { name: 'History of Art', active: false },
                    { name: 'Intro to CS', active: false },
                ].map((folder, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-3 ${folder.active ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className={`w-2 h-2 rounded-full ${folder.active ? 'bg-[#8B5CF6]' : 'bg-gray-600'}`} />
                        {folder.name}
                    </div>
                ))}
            </div>

            {/* Note Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-6">Mitochondria & Cellular Respiration</h1>
                    <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                        <span>Last edited 2 mins ago</span>
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">Synced</span>
                    </div>

                    <div className="prose prose-invert prose-lg">
                        <p className="text-gray-300">
                            The <span className="text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10 px-1 rounded">mitochondria</span> is often referred to as the powerhouse of the cell. It generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 mt-4">
                            <li>Double membrane structure</li>
                            <li>Contains its own DNA</li>
                            <li>Key role in apoptosis (programmed cell death)</li>
                        </ul>

                        <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex gap-3">
                            <div className="mt-0.5">💡</div>
                            <div>
                                <strong>AI Insight:</strong> Mitochondria likely evolved from bacteria that were engulfed by ancestral eukaryotic cells (Endosymbiotic Theory).
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const CourseMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800" showControls={true}>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full"
        >
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-[#0A0A0A] p-6 hidden md:block">
                <div className="h-8 w-24 bg-white/10 rounded mb-8"></div>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-12 bg-white/5 rounded"></div>
                        <div className="h-10 w-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#8B5CF6]"></div>
                            <div className="h-2 w-20 bg-white/20 rounded"></div>
                        </div>
                        <div className="h-10 w-full bg-transparent hover:bg-white/5 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full border border-white/20"></div>
                            <div className="h-2 w-24 bg-white/10 rounded"></div>
                        </div>
                        <div className="h-10 w-full bg-transparent hover:bg-white/5 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full border border-white/20"></div>
                            <div className="h-2 w-16 bg-white/10 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">MODULE 1</span>
                    <span className="text-[#9CA3AF] text-sm">3 min read</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-6">Introduction to Neural Networks</h3>

                <div className="space-y-4 mb-8">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>

                {/* Interactive Element */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 mb-8">
                    <h4 className="font-semibold text-white mb-4">Quick Check</h4>
                    <div className="space-y-3">
                        {[
                            "A biological neuron",
                            "A mathematical function",
                            "A computer chip"
                        ].map((opt, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${i === 1 ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' : 'border-white/5 bg-black/20'} flex justify-between items-center cursor-pointer`}>
                                <span className={i === 1 ? 'text-white' : 'text-[#9CA3AF]'}>{opt}</span>
                                {i === 1 && <Check className="w-4 h-4 text-[#8B5CF6]" />}
                            </div>
                        ))}
                    </div>
                </div>

                <button className="flex items-center justify-center w-full py-4 rounded-lg bg-[#8B5CF6] text-white font-bold hover:bg-[#7C3AED] transition-colors shadow-lg shadow-purple-500/20">
                    Continue to Lesson 2 <ChevronRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </motion.div>
    </AppWindow>
);

const FeedMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 flex justify-center items-center">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md h-[90%] bg-black border border-white/10 rounded-2xl overflow-hidden relative"
        >
            {/* Mobile Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur absolute top-0 w-full z-10">
                <div className="font-bold text-lg">For You</div>
                <div className="w-8 h-8 rounded-full bg-white/10"></div>
            </div>

            {/* Cards */}
            <div className="h-full pt-16 p-4 space-y-4">
                {/* Card 1 */}
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">HISTORY</div>
                    </div>
                    <p className="text-xl font-medium text-white mb-6">Which empire was known as the "Empire on which the sun never sets"?</p>
                    <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center text-sm cursor-pointer">Roman Empire</div>
                        <div className="p-3 rounded-lg bg-[#28C840]/20 border border-[#28C840]/50 text-white text-center text-sm cursor-pointer">British Empire</div>
                        <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center text-sm cursor-pointer">Mongol Empire</div>
                    </div>
                </div>

                {/* Card 2 Partial */}
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 opacity-50">
                    <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
                    <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const ChatMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 p-6 flex flex-col">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col max-w-2xl mx-auto w-full"
        >
            <div className="flex-1 space-y-6">
                <div className="flex gap-4">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-xs font-bold">AI</div></div>
                    <div className="flex-1">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 text-[#D1D5DB] leading-relaxed">
                            Based on your recent quiz results, you seem to be struggling with <span className="text-[#8B5CF6]">Quantum Entanglement</span>. Would you like a quick 2-minute explanation?
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 flex-row-reverse">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-gray-600"></div></div>
                    <div className="flex-1 text-right">
                        <div className="bg-[#8B5CF6] p-4 rounded-2xl rounded-tr-sm text-white inline-block text-left">
                            Yes please, explain it like I'm 5.
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-xs font-bold">AI</div></div>
                    <div className="flex-1">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 text-[#D1D5DB] leading-relaxed">
                            Imagine you have two magic dice. No matter how far apart they are—even if one is on Mars—if you roll a 6 on one, the other one INSTANTLY shows a 6 too. They are connected in a spooky way! 🎲🎲
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 relative">
                <input
                    type="text"
                    placeholder="Ask Genie anything..."
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-full py-4 px-6 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
                <div className="absolute right-2 top-2 p-2 bg-[#8B5CF6] rounded-full">
                    <ChevronRight className="w-4 h-4 text-white" />
                </div>
            </div>
        </motion.div>
    </AppWindow>
);
