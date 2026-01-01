'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Sparkles, Heart, Zap, HelpCircle, Trophy } from 'lucide-react';
import { Challenge } from '@/lib/courseCreation/types';

interface UnifiedLearningShellProps {
    children: React.ReactNode;
    title: string;
    progress: number; // 0 to 100
    onClose: () => void;
    onBack?: () => void;
    lives?: number;
    xp?: number;
    showGenie?: boolean;
}

export default function UnifiedLearningShell({
    children,
    title,
    progress,
    onClose,
    onBack,
    lives = 5,
    xp = 0,
    showGenie = false,
}: UnifiedLearningShellProps) {
    const [isGenieOpen, setIsGenieOpen] = useState(false);

    return (
        <div className="fixed inset-0 bg-gray-950 text-white z-[100] flex flex-col overflow-hidden safe-area-inset-top">
            {/* Immersive Header - Duolingo Style */}
            <header className="px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center gap-4 sticky top-0 z-10">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                {/* Dynamic Progress Bar */}
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    />
                    <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                </div>

                {/* Mastery Status Bar */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                        progress <= 30 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        progress <= 69 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                        'bg-green-500/10 border-green-500/30 text-green-400'
                    }`}>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black uppercase tracking-tighter leading-none opacity-60">Mastery</span>
                            <span className="text-sm font-black leading-none">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-2 h-8 bg-gray-800 rounded-full overflow-hidden flex flex-col justify-end">
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${progress}%` }}
                                className={`w-full rounded-full ${
                                    progress <= 30 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                    progress <= 69 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                                    'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                }`}
                            />
                        </div>
                        {progress >= 70 && (
                            <Trophy className="w-4 h-4 text-green-400 animate-bounce" />
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-lg">
                        <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold">{xp}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative flex flex-col h-full">
                <div className="w-full h-full p-4 md:p-8 flex flex-col">
                    {children}
                </div>
            </main>

            {/* Genie Proactive Coach - Floating Action Button Style */}
            <AnimatePresence>
                {showGenie && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <button
                            onClick={() => setIsGenieOpen(!isGenieOpen)}
                            className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-110 active:scale-95 transition-all group relative"
                        >
                            <Sparkles className="w-7 h-7 text-white" />
                            <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Genie Sidebar/Drawer */}
            <AnimatePresence>
                {isGenieOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGenieOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl z-[120] flex flex-col"
                        >
                            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-indigo-950/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Genie Coach</h3>
                                        <p className="text-xs text-indigo-300">Proactive Assistant</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsGenieOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Genie content will live here */}
                                <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-6">
                                    <p className="text-sm italic text-gray-300 leading-relaxed">
                                        "I noticed you're exploring <strong>{title}</strong>. I've prepared a quick interactive check-in to help solidify the concept."
                                    </p>
                                </div>

                                {/* Placeholder for Interactive Payloads */}
                                <div className="space-y-4">
                                    <div className="h-40 bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500">
                                        <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-sm">Interactive Payload Area</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-area-inset-top {
            padding-top: env(safe-area-inset-top);
          }
        }
      `}</style>
        </div>
    );
}
