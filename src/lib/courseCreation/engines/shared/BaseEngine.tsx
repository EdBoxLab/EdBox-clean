'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/courseCreation/types';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Lightbulb, Trophy, Clock } from 'lucide-react';

interface BaseEngineProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

interface BaseEngineState {
  isRunning: boolean;
  output: string;
  isComplete: boolean;
  isSuccess: boolean;
  showHint: boolean;
  currentHintIndex: number;
}

export default function BaseEngine({ challenge, onComplete }: BaseEngineProps) {
  const [state, setState] = useState<BaseEngineState>({
    isRunning: false,
    output: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
  });

  const handleRun = async () => {
    setState(prev => ({ ...prev, isRunning: true, output: '' }));
    
    try {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just mark as successful
      const success = true;
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        output: success ? 'Challenge completed successfully!' : 'Challenge failed. Try again.',
        isComplete: true,
        isSuccess: success,
      }));
      
      if (onComplete) {
        onComplete(success);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        output: 'An error occurred. Please try again.',
        isComplete: true,
        isSuccess: false,
      }));
    }
  };

  const showNextHint = () => {
    if (state.currentHintIndex < challenge.hints.length - 1) {
      setState(prev => ({
        ...prev,
        showHint: true,
        currentHintIndex: prev.currentHintIndex + 1,
      }));
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{challenge.title}</h2>
            <p className="text-gray-400 text-sm">{challenge.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-blue-400">
              <Clock className="w-4 h-4" />
              <span>{challenge.estimatedMinutes}m</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span>{challenge.xpReward} XP</span>
            </div>
            <div className="px-2 py-1 bg-gray-700 rounded text-xs">
              {challenge.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Challenge Content */}
        <div className="w-1/2 p-4 border-r border-gray-700">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Challenge</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300">{challenge.description}</p>
              </div>
            </div>

            {/* Starter Code or Content */}
            {challenge.starterCode && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Starter Code</h3>
                <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-green-400">{challenge.starterCode}</pre>
                </div>
              </div>
            )}

            {/* Hints */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Hints</h3>
                {challenge.hints.length > 0 && (
                  <button
                    onClick={showNextHint}
                    disabled={state.currentHintIndex >= challenge.hints.length - 1}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Show Hint
                  </button>
                )}
              </div>
              
              {state.showHint && challenge.hints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3"
                >
                  <p className="text-yellow-200 text-sm">
                    💡 {challenge.hints[state.currentHintIndex]}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Workspace & Output */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex-1 space-y-4">
            {/* Workspace */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Workspace</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-64">
                <textarea
                  className="w-full h-full bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
                  placeholder="Write your solution here..."
                  defaultValue={challenge.starterCode || ''}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleRun}
                disabled={state.isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                <Play className="w-4 h-4" />
                {state.isRunning ? 'Running...' : 'Run Solution'}
              </button>
            </div>

            {/* Output */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Output</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-32 overflow-y-auto">
                {state.output && (
                  <div className={`flex items-start gap-2 ${state.isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                    {state.isComplete && (
                      state.isSuccess ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <XCircle className="w-5 h-5 mt-0.5" />
                    )}
                    <pre className="text-sm">{state.output}</pre>
                  </div>
                )}
                {!state.output && (
                  <p className="text-gray-500 text-sm">Output will appear here...</p>
                )}
              </div>
            </div>
          </div>

          {/* Success State */}
          {state.isComplete && state.isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-green-900/20 border border-green-600/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Challenge Completed!</span>
              </div>
              <p className="text-green-200 text-sm mb-3">{challenge.explanation}</p>
              <div className="text-sm text-green-300">
                🎉 You earned {challenge.xpReward} XP!
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}