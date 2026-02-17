'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SkillNode, Challenge } from '@/lib/courseCreation/types';


interface EngineModalProps {
  selectedSkill: SkillNode | null;
  sessionChallenges: Challenge[];
  conceptExplanation: string;
  activeChallengeIndex: number;
  currentChallenge: Challenge | null;
  isGenerating: boolean;
  onClose: () => void;
  onChallengeSelect: (index: number) => void;
  onChallengeComplete: (success: boolean) => Promise<void>;
}

export default function EngineModal({
  selectedSkill,
  sessionChallenges,
  conceptExplanation,
  activeChallengeIndex,
  currentChallenge,
  isGenerating,
  onClose,
  onChallengeSelect,
  onChallengeComplete
}: EngineModalProps) {
  // Render engine based on type
  const renderEngine = () => {
    if (!currentChallenge) {
      return (
        <div className="flex items-center justify-center h-full text-zinc-400">
          <p>No challenge selected</p>
        </div>
      );
    }

    // Validate challenge data
    if (!currentChallenge.title || !currentChallenge.description) {
      console.warn('Invalid challenge data:', currentChallenge);
      return (
        <div className="flex items-center justify-center h-full text-zinc-400">
          <p>Challenge data is incomplete</p>
        </div>
      );
    }

    console.log('Rendering challenge:', {
      title: currentChallenge.title,
      engine: currentChallenge.engine,
      difficulty: currentChallenge.difficulty
    });

    // Convert engine to string for comparison since it comes from the database as a string
    const engineStr = String(currentChallenge.engine || 'default').toLowerCase();

    const commonProps = {
      challenge: currentChallenge,
      onComplete: onChallengeComplete
    };

    switch (engineStr) {
      default:
        console.log('No matching engine for:', engineStr);
        return <div className="text-white">Engine not available for: {engineStr}</div>;
    }
  };

  return (
    <AnimatePresence>
      {selectedSkill && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full sm:h-[98vh] md:h-[90vh] sm:max-w-7xl bg-[#18181b] rounded-none sm:rounded-xl md:rounded-2xl border-0 sm:border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
            style={{ maxHeight: '100vh', maxWidth: '100vw' }}
          >
            <div className="h-12 sm:h-14 md:h-16 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-4 md:px-6 shrink-0">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">{selectedSkill.title}</h3>
                <p className="text-xs sm:text-xs md:text-sm text-zinc-400 truncate hidden sm:block">{selectedSkill.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row h-full overflow-hidden">
              {/* Sidebar - Mobile: Horizontal scroll, Desktop: Vertical sidebar */}
              <div className="w-full sm:w-64 bg-zinc-900 border-b sm:border-r sm:border-b-0 border-zinc-800 flex sm:flex-col shrink-0 max-h-32 sm:max-h-none">
                <div className="hidden sm:block p-3 sm:p-4 border-b border-zinc-800">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-wider">Lesson Plan</h4>
                </div>

                <div className="flex sm:flex-col flex-1 overflow-x-auto sm:overflow-y-auto sm:overflow-x-visible p-2 space-x-2 sm:space-x-0 sm:space-y-2">
                  {/* Concept / Explanation Item */}
                  <button
                    onClick={() => onChallengeSelect(-1)}
                    className={`flex-shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-colors ${activeChallengeIndex === -1 ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                  >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Info size={12} className="sm:w-3.5 sm:h-3.5" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs sm:text-sm font-semibold">Concept</p>
                      <p className="text-xs opacity-70">Start here</p>
                    </div>
                    <div className="sm:hidden">
                      <p className="text-xs font-semibold whitespace-nowrap">Concept</p>
                    </div>
                  </button>

                  {/* Challenges List */}
                  {sessionChallenges.map((chall, idx) => {
                    // Validate challenge data before rendering
                    const title = chall?.title || `Challenge ${idx + 1}`;
                    const difficulty = chall?.difficulty || 'Medium';
                    const challengeId = chall?.id || `challenge-${idx}`;

                    return (
                      <button
                        key={challengeId}
                        onClick={() => onChallengeSelect(idx)}
                        className={`flex-shrink-0 sm:w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-colors ${activeChallengeIndex === idx ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                          }`}
                      >
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 ${activeChallengeIndex === idx ? 'bg-white/20' : 'bg-zinc-800'
                          }`}>
                          <span className="text-xs font-bold">{idx + 1}</span>
                        </div>
                        <div className="min-w-0 hidden sm:block">
                          <p className="text-xs sm:text-sm font-semibold truncate">{title}</p>
                          <p className="text-xs opacity-70">{difficulty}</p>
                        </div>
                        <div className="sm:hidden">
                          <p className="text-xs font-semibold whitespace-nowrap">{idx + 1}</p>
                        </div>
                      </button>
                    );
                  })}

                  {isGenerating && (
                    <div className="flex-shrink-0 sm:w-full p-2 sm:p-4 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-xs text-zinc-500 mt-1 sm:mt-2 hidden sm:block">Generating...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-hidden bg-zinc-950 relative min-h-0">
                {activeChallengeIndex === -1 ? (
                  // Explanation View
                  <div className="h-full overflow-y-auto">
                    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
                      <div className="mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                          {selectedSkill.title}: The Concept
                        </h2>
                      </div>

                      {conceptExplanation ? (
                        <div className="prose prose-invert max-w-none prose-sm sm:prose-base md:prose-lg">
                          <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed space-y-4 sm:space-y-6">
                            {conceptExplanation}
                          </div>
                        </div>
                      ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-32 sm:h-64">
                          <p className="text-sm sm:text-base text-zinc-400 animate-pulse">Designing your lesson plan...</p>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                          <p className="text-sm sm:text-base text-zinc-400">No content available. Select a challenge to begin.</p>
                        </div>
                      )}

                      {!isGenerating && sessionChallenges.length > 0 && (
                        <div className="mt-8 sm:mt-12 flex justify-center sm:justify-end">
                          <button
                            onClick={() => onChallengeSelect(0)}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg sm:rounded-xl transition-all hover:scale-105 text-sm sm:text-base"
                          >
                            <span>Start First Challenge</span>
                            <Target size={16} className="sm:w-4.5 sm:h-4.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Engine View - Make it scrollable and responsive
                  <div className="h-full overflow-y-auto">
                    {renderEngine()}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}