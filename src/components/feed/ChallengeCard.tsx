import React, { useState } from 'react';
import { Trophy, HelpCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChallengeCardProps {
    item: {
        title: string;
        topic: string;
        question: string;
        hint: string;
        answer: string;
    };
    isActive: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ item, isActive }) => {
    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-6 relative overflow-hidden">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 w-full max-w-sm"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-orange-500/20 rounded-full border border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                        <Trophy className="w-8 h-8 text-orange-400" />
                    </div>
                </div>

                <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-2 block">Mental Challenge</span>
                <h3 className="text-2xl font-black text-white mb-6 leading-tight">{item.title}</h3>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl mb-6 shadow-2xl">
                    <p className="text-lg text-white/90 font-medium leading-relaxed italic">
                        "{item.question}"
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!showAnswer ? (
                        <motion.div
                            key="action"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-center gap-2 text-white/40 text-xs font-bold bg-white/5 py-2 px-4 rounded-full w-fit mx-auto">
                                <Lightbulb className="w-3 h-3" />
                                <span>HINT: {item.hint}</span>
                            </div>
                            <button
                                onClick={() => setShowAnswer(true)}
                                className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl shadow-xl hover:bg-orange-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                REVEAL SOLUTION
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="answer"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-500/10 border border-green-500/30 p-6 rounded-3xl"
                        >
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2 block">The Solution</span>
                            <p className="text-base text-green-100 font-bold leading-relaxed">
                                {item.answer}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
};
