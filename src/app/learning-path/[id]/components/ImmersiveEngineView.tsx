'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SkillNode, Challenge } from '@/lib/courseCreation/types';
import UnifiedLearningShell from './UnifiedLearningShell';
import WarmUpView from './WarmUpView';
import { Trophy, ArrowRight, RefreshCcw } from 'lucide-react';

// Dynamic imports for engines
const CodeStudio = dynamic(() => import('@/lib/courseCreation/engines/codestudio/App'), { ssr: false });
const WriteLab = dynamic(() => import('@/lib/courseCreation/engines/writingstudio/App'), { ssr: false });
const MathLab = dynamic(() => import('@/lib/courseCreation/engines/mathlab/App'), { ssr: false });
const LinguaLab = dynamic(() => import('@/lib/courseCreation/engines/lingualab/App'), { ssr: false });

interface ImmersiveEngineViewProps {
    selectedSkill: SkillNode | null;
    sessionChallenges: Challenge[];
    activeChallengeIndex: number;
    currentChallenge: Challenge | null;
    isGenerating: boolean;
    onClose: () => void;
    onChallengeSelect: (index: number) => void;
    onChallengeComplete: (success: boolean) => Promise<void>;
}

export default function ImmersiveEngineView({
    selectedSkill,
    sessionChallenges,
    activeChallengeIndex,
    currentChallenge,
    isGenerating,
    onClose,
    onChallengeSelect,
    onChallengeComplete
}: ImmersiveEngineViewProps) {
    const [viewState, setViewState] = useState<'warmup' | 'engine' | 'success'>('warmup');
    const [showGenie, setShowGenie] = useState(false);

    // Switch to engine after warm-up
    const handleWarmUpComplete = () => {
        if (activeChallengeIndex === -1 && sessionChallenges.length > 0) {
            // If we were on the "Intro", move to the first real challenge
            onChallengeSelect(0);
        } else {
            setViewState('engine');
        }
        setShowGenie(true);
    };

    // Handle completion with radical UX feedback
    const handleChallengeComplete = async (success: boolean) => {
        if (success) {
            setViewState('success');
            // Delay the actual completion call to let animation play
            setTimeout(() => onChallengeComplete(true), 2500);
        } else {
            await onChallengeComplete(false);
        }
    };

    // Reset view state when challenge changes
    useEffect(() => {
        if (activeChallengeIndex === -1) {
            setViewState('warmup');
        } else if (viewState !== 'success') {
            // Stay in 'success' if we just finished, otherwise go to engine
            setViewState('engine');
        }
    }, [activeChallengeIndex, viewState]);

    if (!selectedSkill) return null;

    const skillTitle = selectedSkill.title || (selectedSkill as any).name || 'this skill';
    const totalSteps = sessionChallenges.length + 1; // +1 for warm-up
    const currentStep = activeChallengeIndex + 2; // +1 for 0-index, +1 for warm-up
    const progressPercent = (currentStep / totalSteps) * 100;

    const renderEngine = () => {
        if (!currentChallenge) return null;
        const commonProps = {
            challenge: currentChallenge,
            onComplete: handleChallengeComplete
        };

        const engineStr = String(currentChallenge.engine || 'default').toLowerCase();

        switch (engineStr) {
            case 'codestudio': return <CodeStudio {...commonProps} />;
            case 'writingstudio': return <WriteLab {...commonProps} />;
            case 'mathlab': return <MathLab {...commonProps} />;
            case 'lingualab': return <LinguaLab {...commonProps} />;
            default: return <div className="p-8 text-center text-gray-500">Engine {engineStr} is currently being optimized...</div>;
        }
    };

    return (
        <UnifiedLearningShell
            title={selectedSkill.title}
            progress={progressPercent}
            onClose={onClose}
            lives={5}
            xp={selectedSkill.xpReward || 0}
            showGenie={showGenie}
        >
            <AnimatePresence mode="wait">
                {viewState === 'warmup' && (
                    <motion.div
                        key="warmup"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="flex-1"
                    >
                        <WarmUpView
                            description={selectedSkill.description}
                            steps={currentChallenge?.warmUp?.steps || [
                                {
                                    prompt: `Let's start by understanding ___ in ${skillTitle}.`,
                                    options: [skillTitle, 'concepts'],
                                    correctAnswer: skillTitle
                                }
                            ]}
                            onComplete={handleWarmUpComplete}
                        />
                    </motion.div>
                )}

                {viewState === 'engine' && (
                    <motion.div
                        key="engine"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 min-h-0"
                    >
                        {renderEngine()}
                    </motion.div>
                )}

                {viewState === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"
                            />
                            <div className="relative w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                                <Trophy className="w-16 h-16 text-white" />
                            </div>
                        </div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 text-4xl font-black text-white"
                        >
                            EXCELLENT!
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-2 text-xl text-yellow-500 font-bold"
                        >
                            Mastery achieved in this step
                        </motion.p>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: 'spring' }}
                            className="mt-8 px-6 py-3 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-4"
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">XP Gained</span>
                                <span className="text-2xl font-black text-white">+{currentChallenge?.xpReward || 50}</span>
                            </div>
                            <div className="w-px h-10 bg-gray-800" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">New Goal</span>
                                <span className="text-sm font-black text-indigo-400">NEXT CHALLENGE</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </UnifiedLearningShell>
    );
}
