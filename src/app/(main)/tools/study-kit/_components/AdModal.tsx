'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Crown } from 'lucide-react';

interface AdModalProps {
    showAdModal: boolean;
    setShowAdModal: (v: boolean) => void;
    adContentType: 'quizzes' | 'flashcards' | 'notes' | null;
    isWatchingAd: boolean;
    adCountdown: number;
    handleAdComplete: () => void;
    onNavigatePricing: () => void;
}

export function AdModal({
    showAdModal,
    setShowAdModal,
    adContentType,
    isWatchingAd,
    adCountdown,
    handleAdComplete,
    onNavigatePricing,
}: AdModalProps) {
    return (
        <AnimatePresence>
            {showAdModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => !isWatchingAd && setShowAdModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full text-center"
                    >
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Unlock More Content</h3>
                        <p className="text-zinc-400 mb-6">
                            Watch a short ad to generate more {adContentType === 'notes' ? 'custom notes' : adContentType}
                        </p>

                        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7134321558578802"
                            crossOrigin="anonymous"></script>

                        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-6">
                            <div className="text-xs uppercase tracking-widest text-indigo-400 mb-3">Sponsored</div>
                            <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                                <Crown className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-white">Upgrade to Premium</p>
                                <p className="text-xs text-zinc-400 mt-1">Remove ads & get unlimited generations</p>
                            </div>
                            <button
                                onClick={onNavigatePricing}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                                Learn More →
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAdModal(false)}
                                disabled={isWatchingAd}
                                className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdComplete}
                                disabled={isWatchingAd}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold transition disabled:opacity-50"
                            >
                                {isWatchingAd ? `Wait ${adCountdown}s...` : 'Continue'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
