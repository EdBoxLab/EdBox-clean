'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Brain, Target, Sparkles, Loader2, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const OnboardingFlow = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!goal.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/skill-graph/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal,
                    context: "User wants to learn by doing"
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to generate path');

            // Success! Redirect to the skill graph
            // Assuming the response contains { startSkillId: ... } or just redirect to graph view
            console.log("Graph generated:", data);

            // In a real app, we'd redirect to /learn or /dashboard
            // router.push('/dashboard'); 
            setStep(3); // Show success state for now

        } catch (err: any) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <AnimatePresence mode="wait">

                {/* STEP 1: WELCOME */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center space-y-8 py-12"
                    >
                        <div className="inline-flex p-4 rounded-full bg-indigo-500/10 mb-4">
                            <Brain className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Transform How You Learn
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-lg mx-auto">
                            No more boring modules. Tell us what you want to satisfy, and we'll build a custom engine for you to master it.
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-lg transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2 mx-auto"
                        >
                            Start My Journey <ArrowRight size={20} />
                        </button>
                    </motion.div>
                )}

                {/* STEP 2: GOAL INPUT */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-8">
                            <Target className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white">What's your mission?</h2>
                            <p className="text-zinc-400 mt-2">Be specific. "Build a chatbot" is better than "Learn Python".</p>
                        </div>

                        <div className="relative">
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="I want to learn how to..."
                                className="w-full h-32 bg-[#1f1f23] border border-zinc-700 rounded-xl p-4 text-lg text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600 resize-none"
                                disabled={isGenerating}
                            />
                            <Sparkles className="absolute bottom-4 right-4 text-zinc-600 pointer-events-none" size={20} />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!goal.trim() || isGenerating}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" /> Analyzing Goal...
                                </>
                            ) : (
                                'Generate My Skill Graph'
                            )}
                        </button>
                    </motion.div>
                )}

                {/* STEP 3: SUCCESS (Temporary) */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-6">
                            <Rocket className="w-16 h-16 text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Mission Accepted!</h2>
                        <p className="text-zinc-400 mb-8">
                            We've constructed a custom skill graph for you.
                            <br /> It contains 12 micro-skills and 3 projects.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')} // Placeholder
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg hover:shadow-green-500/25"
                        >
                            Launch Engine
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
