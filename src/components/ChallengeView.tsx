'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Lightbulb,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    ArrowLeft,
    Sparkles,
    Zap,
    Code
} from 'lucide-react';
import { GeneratedChallenge } from '@/types/skill-progression';

interface ChallengeViewProps {
    challenge: GeneratedChallenge & {
        hint?: string;
        expectedOutcome?: string;
    };
    onSuccess: (xp: number) => void;
    onFail: (feedback: string) => void;
    onClose: () => void;
    onSendToChat?: (message: string) => void;  // Send answer to chat for Genie review
}

export default function ChallengeView({
    challenge,
    onSuccess,
    onFail,
    onClose,
    onSendToChat
}: ChallengeViewProps) {
    const [answer, setAnswer] = useState('');
    const [showHints, setShowHints] = useState(false);
    const [activeHintIndex, setActiveHintIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle');
    const [feedback, setFeedback] = useState('');

    // Parse challenge title for a leading "Phase" prefix like "Phase 03: Practical Challenge"
    const parseChallengeHeader = (title: string) => {
        const phaseRegex = /^\s*(Phase\s*\d+)\s*[:\-–]\s*(.+)$/i;
        const match = title.match(phaseRegex);
        if (match) {
            return { phase: match[1].trim(), titleText: match[2].trim() };
        }

        // fallback: try to split on first colon if present (e.g., "Phase 03: ..." variations)
        const splitColon = title.split(':');
        if (splitColon.length > 1) {
            return { phase: splitColon[0].trim(), titleText: splitColon.slice(1).join(':').trim() };
        }

        return { phase: null as string | null, titleText: title };
    };

    const { phase, titleText } = parseChallengeHeader(challenge.title);

    // Derive a compact subtitle to show beneath the title (skill id, first objective, or first line of description)
    const subtitle = challenge.skillId || challenge.learningObjectives?.[0] || (challenge.description ? challenge.description.split('\n')[0].slice(0, 120) : '');

    const xpReward = challenge.difficultyLevel === 'Easy' ? 50 : challenge.difficultyLevel === 'Medium' ? 100 : 200;

    const handleSubmit = async () => {
        if (!answer.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setStatus('idle');
        setFeedback('');

        try {
            const response = await fetch('/api/genie/interactive-course/evaluate-challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challenge, answer })
            });

            const result = await response.json();

            // Send answer to chat for Genie to see - Format cleanly
            if (onSendToChat) {
                // Just send the answer text contextually
                onSendToChat(`I've completed the challenge! Here is my submission:\n\n${answer}`);
            }

            if (result.passed) {
                setStatus('success');
                setFeedback(result.feedback || "Amazing work! You've mastered this concept effectively.");
                setTimeout(() => onSuccess(result.xrReward || xpReward), 2500);
            } else {
                setStatus('fail');
                setFeedback(result.feedback || "Not quite there yet. Check the feedback and try again!");
            }
        } catch (error) {
            console.error('Challenge Submission Error:', error);
            setFeedback("I encountered a glitch while evaluating your answer. Please try again.");
            setStatus('fail');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-950/80 backdrop-blur-xl"
        >
            <div className="relative w-full max-w-4xl h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            {/* show parsed phase badge if present, otherwise the generic label */}
                            {phase ? (
                                <span className="text-[10px] font-black px-3 py-1 bg-white/5 rounded-full text-gray-300 uppercase tracking-widest">{phase}</span>
                            ) : (
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Challenge</span>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-white">{titleText}</h2>

                        {subtitle && (
                            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-bold text-purple-400">{xpReward} XP</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
                    {/* Objective */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Sparkles className="w-4 h-4" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Your Goal</h3>
                        </div>
                        <p className="text-lg text-gray-200 leading-relaxed font-medium">
                            {challenge.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Complexity</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-0.5 rounded-md text-xs font-bold ${challenge.difficultyLevel === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                        challenge.difficultyLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-red-500/10 text-red-400'
                                        }`}>
                                        {challenge.difficultyLevel}
                                    </div>
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        ~{challenge.estimatedTime} min
                                    </span>
                                </div>
                            </div>

                            {/* Expected Outcome - NEW */}
                            {(challenge as any).expectedOutcome && (
                                <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20">
                                    <h4 className="text-xs font-bold text-green-400 uppercase mb-2">✅ Expected Outcome</h4>
                                    <p className="text-sm text-gray-300">{(challenge as any).expectedOutcome}</p>
                                </div>
                            )}

                            {/* Hint - NEW */}
                            {(challenge as any).hint && (
                                <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20">
                                    <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">💡 Hint</h4>
                                    <p className="text-sm text-gray-300">{(challenge as any).hint}</p>
                                </div>
                            )}

                            {challenge.learningObjectives?.length > 0 && (
                                <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-700/50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Learning Targets</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {challenge.learningObjectives.map((obj, i) => (
                                            <span key={i} className="text-xs text-gray-400 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-purple-500" />
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Submission Area */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Code className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Your Submission</h3>
                            </div>
                            <button
                                onClick={() => setShowHints(!showHints)}
                                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                            >
                                <Lightbulb className="w-3 h-3" />
                                {showHints ? 'Hide Hints' : 'Need a hint?'}
                            </button>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Type your answer, code, or explanation here..."
                                className="w-full h-48 bg-gray-950 border border-gray-700 rounded-2xl p-6 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none shadow-inner"
                                disabled={status !== 'idle' || isSubmitting}
                            />

                            <AnimatePresence>
                                {showHints && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-4 left-4 right-4 p-4 bg-purple-900/40 border border-purple-500/30 rounded-xl backdrop-blur-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 bg-purple-500 rounded-lg">
                                                <Lightbulb className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-purple-100 font-medium">
                                                    {challenge.hints[activeHintIndex]}
                                                </p>
                                                {challenge.hints.length > 1 && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {challenge.hints.map((_, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveHintIndex(i)}
                                                                className={`w-2 h-2 rounded-full transition-all ${i === activeHintIndex ? 'w-4 bg-purple-400' : 'bg-purple-700'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Validation Status */}
                    <AnimatePresence>
                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`p-6 rounded-2xl flex items-start gap-4 ${status === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl scale-125 ${status === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {status === 'success' ? <Trophy className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className={`text-lg font-bold mb-1 ${status === 'success' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {status === 'success' ? 'Mission Accomplished!' : 'Keep Pushing!'}
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{feedback}</p>
                                    {status === 'fail' && (
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="mt-3 text-xs font-bold text-red-400 hover:underline uppercase tracking-widest"
                                        >
                                            Retry Challenge
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Criteria</span>
                            <span className="text-xs text-gray-500">{challenge.validationCriteria.length} checks pending</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || isSubmitting || status === 'success'}
                        className={`
              relative px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95
              ${!answer.trim() || isSubmitting
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5'}
            `}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <>Completed <CheckCircle2 className="w-5 h-5" /></>
                        ) : (
                            <>Verify Submission <ChevronRight className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
