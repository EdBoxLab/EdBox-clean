'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SkillNode, Challenge } from '@/lib/courseCreation/types';

// Dynamic imports for engines
const CodeStudio = dynamic(() => import('@/lib/courseCreation/engines/codestudio/App'), { ssr: false });
const WriteLab = dynamic(() => import('@/lib/courseCreation/engines/writingstudio/App'), { ssr: false });
const MathLab = dynamic(() => import('@/lib/courseCreation/engines/mathlab/App'), { ssr: false });
const LinguaLab = dynamic(() => import('@/lib/courseCreation/engines/lingualab/App'), { ssr: false });

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
    if (!currentChallenge) return null;
    console.log('Current challenge engine:', currentChallenge.engine);

    // Convert engine to string for comparison since it comes from the database as a string
    const engineStr = String(currentChallenge.engine).toLowerCase();

    const commonProps = {
      challenge: currentChallenge,
      onComplete: onChallengeComplete
    };

    switch (engineStr) {
      case 'codestudio':
        return <CodeStudio {...commonProps} />;
      case 'writingstudio':
        return <WriteLab {...commonProps} />;
      case 'mathlab':
        return <MathLab {...commonProps} />;
      case 'lingualab':
        return <LinguaLab {...commonProps} />;
      case 'finlab':
        return <WriteLab {...commonProps} />; // Default fallback
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-7xl h-[95vh] md:h-[90vh] bg-[#18181b] rounded-xl md:rounded-2xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="h-14 md:h-16 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-base md:text-lg font-semibold text-white truncate">{selectedSkill.title}</h3>
                <p className="text-xs md:text-sm text-zinc-400 truncate">{selectedSkill.description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-zinc-800">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Lesson Plan</h4>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {/* Concept / Explanation Item */}
                  <button
                    onClick={() => onChallengeSelect(-1)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeChallengeIndex === -1 ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Info size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Concept</p>
                      <p className="text-xs opacity-70">Start here</p>
                    </div>
                  </button>

                  {/* Challenges List */}
                  {sessionChallenges.map((chall, idx) => (
                    <button
                      key={chall.id}
                      onClick={() => onChallengeSelect(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeChallengeIndex === idx ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        activeChallengeIndex === idx ? 'bg-white/20' : 'bg-zinc-800'
                      }`}>
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{chall.title}</p>
                        <p className="text-xs opacity-70">{chall.difficulty}</p>
                      </div>
                      {/* You could add a checkmark icon here if completed */}
                    </button>
                  ))}

                  {isGenerating && (
                    <div className="p-4 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-xs text-zinc-500 mt-2">Generating...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-hidden bg-zinc-950 relative">
                {activeChallengeIndex === -1 ? (
                  // Explanation View
                  <div className="h-full p-8 overflow-y-auto max-w-4xl mx-auto">
                    <div className="mb-8">
                      <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {selectedSkill.title}: The Concept
                      </h2>
                    </div>

                    {conceptExplanation ? (
                      <div className="prose prose-invert max-w-none prose-lg">
                        <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed space-y-6">
                          {conceptExplanation}
                        </div>
                      </div>
                    ) : isGenerating ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <p className="text-zinc-400 animate-pulse">Designing your lesson plan...</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                        <p className="text-zinc-400">No content available. Select a challenge to begin.</p>
                      </div>
                    )}

                    {!isGenerating && sessionChallenges.length > 0 && (
                      <div className="mt-12 flex justify-end">
                        <button
                          onClick={() => onChallengeSelect(0)}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all hover:scale-105"
                        >
                          <span>Start First Challenge</span>
                          <Target size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Engine View
                  renderEngine()
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}