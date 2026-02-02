'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SkillNode, Challenge } from '@/lib/courseCreation/types';
import InteractiveCourseSession from '@/components/InteractiveCourseSession';
import { X, Trophy } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const CodeStudio = dynamic(() => import('@/lib/courseCreation/engines/codestudio/App'), { ssr: false });
const WriteLab = dynamic(() => import('@/lib/courseCreation/engines/writingstudio/App'), { ssr: false });
const MathLab = dynamic(() => import('@/lib/courseCreation/engines/mathlab/App'), { ssr: false });
const LinguaLab = dynamic(() => import('@/lib/courseCreation/engines/lingualab/App'), { ssr: false });

interface ImmersiveEngineViewProps {
    selectedSkill: SkillNode | null;
    parentGraph?: any;
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
    parentGraph,
    sessionChallenges,
    activeChallengeIndex,
    currentChallenge,
    isGenerating,
    onClose,
    onChallengeSelect,
    onChallengeComplete
}: ImmersiveEngineViewProps) {
    const [viewState, setViewState] = useState<'interactive' | 'engine' | 'success'>('interactive');
    const [user, setUser] = useState<any>(null);

    const userFetchedRef = useRef(false);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        if (userFetchedRef.current) return;

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            userFetchedRef.current = true;
        };
        getUser();
    }, []);

    const handleInteractiveComplete = () => {
        setViewState('engine');

        if (activeChallengeIndex === -1 && sessionChallenges.length > 0) {
            setTimeout(() => {
                onChallengeSelect(0);
            }, 100);
        }
    };

    const handleChallengeComplete = async (success: boolean) => {
        if (success) {
            setViewState('success');
            setTimeout(() => onChallengeComplete(true), 2500);
        } else {
            await onChallengeComplete(false);
        }
    };

    useEffect(() => {
        if (activeChallengeIndex === -1) {
            setViewState('interactive');
        } else if (viewState !== 'success') {
            setViewState('engine');
        }
    }, [activeChallengeIndex, viewState]);

    if (!selectedSkill) return null;

    const skillTitle = selectedSkill.title || (selectedSkill as any).name || 'this skill';

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
        <div className="fixed inset-0 bg-gray-950 text-white z-50 flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
                {viewState === 'interactive' && (
                    <motion.div
                        key="interactive"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-gray-900/80 hover:bg-gray-800 backdrop-blur-md border border-gray-700 rounded-xl transition-all shadow-xl"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-300" />
                        </button>
                        {user ? (
                            <InteractiveCourseSession
                                courseId={parentGraph?.id || selectedSkill.id}
                                userId={user.id}
                                courseTitle={skillTitle}
                                courseCreator="EdBox AI"
                                skillGraph={parentGraph}
                                initialNodeId={selectedSkill.id}
                                onStartChallenge={handleInteractiveComplete}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-gray-400 mb-4">Please log in to start your learning session</p>
                                    <button
                                        onClick={handleInteractiveComplete}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all"
                                    >
                                        Continue to Practice
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {viewState === 'engine' && (
                    <motion.div
                        key="engine"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col"
                    >
                        <header className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between">
                            <h1 className="text-lg font-semibold text-white">{skillTitle}</h1>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </header>
                        <div className="flex-1 min-h-0">
                            {renderEngine()}
                        </div>
                    </motion.div>
                )}

                {viewState === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-950 to-gray-900"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full"
                            />
                            <div className="relative w-28 h-28 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                                <Trophy className="w-14 h-14 text-white" />
                            </div>
                        </div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 text-3xl font-bold text-white"
                        >
                            Well Done!
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-3 text-lg text-gray-300 max-w-md"
                        >
                            You've successfully completed this challenge
                        </motion.p>

                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            onClick={onClose}
                            className="mt-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all shadow-xl"
                        >
                            Continue Learning
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}