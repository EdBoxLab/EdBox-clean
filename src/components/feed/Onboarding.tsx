import React, { useState } from 'react';
import { Loader2, Sparkles, BookOpen, Target } from 'lucide-react';
import type { UserPreferences } from '@/types/feed';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
    onComplete: (prefs: UserPreferences) => void;
}

const INTERESTS = [
    'Science', 'History', 'Technology', 'Art', 'Music',
    'Literature', 'Space', 'Nature', 'Psychology', 'Philosophy',
    'Coding', 'Business', 'Math', 'Languages', 'Geography'
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSubmit = async () => {
        if (selectedInterests.length < 3) return;

        setIsSubmitting(true);
        setTimeout(() => {
            onComplete({
                interests: selectedInterests,
                learningStyle: 'visual',
                onboarded: true
            });
            setIsSubmitting(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-6 relative overflow-y-auto overscroll-contain py-12 scroll-smooth">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(59,130,246,0.1),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(236,72,153,0.1),transparent_60%)]" />

            <div className="max-w-xl w-full space-y-12 z-10 my-auto">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 mb-4"
                    >
                        <Target className="w-8 h-8 text-purple-400" />
                    </motion.div>
                    <motion.h1 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl sm:text-5xl font-black tracking-tight"
                    >
                        Personalize <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Your Mind</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/40 font-medium text-lg"
                    >
                        Pick at least 3 topics to fuel your daily growth.
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                    {INTERESTS.map((interest, index) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                            <motion.button
                                key={interest}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 + index * 0.03 }}
                                onClick={() => toggleInterest(interest)}
                                className={`group relative p-4 rounded-2xl text-sm font-black transition-all duration-500 border overflow-hidden ${
                                    isSelected
                                        ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] scale-105'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="relative z-10 flex items-center justify-center gap-2">
                                    {interest}
                                    {isSelected && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                                </div>
                                {isSelected && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                >
                    <button
                        onClick={handleSubmit}
                        disabled={selectedInterests.length < 3 || isSubmitting}
                        className={`group relative w-full py-5 rounded-[2rem] font-black text-xl transition-all duration-500 overflow-hidden ${
                            selectedInterests.length >= 3 && !isSubmitting
                                ? 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]'
                                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                        }`}
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Begin Journey
                                    <BookOpen className={`w-5 h-5 transition-transform duration-500 ${selectedInterests.length >= 3 ? 'group-hover:translate-x-1' : ''}`} />
                                </>
                            )}
                        </div>
                        {selectedInterests.length >= 3 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        )}
                    </button>
                    <p className="text-center mt-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                        {selectedInterests.length < 3 
                            ? `Select ${3 - selectedInterests.length} more to continue`
                            : 'Ready to launch'}
                    </p>
                </motion.div>
            </div>

            {/* Particle field */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/10 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-100, 100],
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Onboarding;
