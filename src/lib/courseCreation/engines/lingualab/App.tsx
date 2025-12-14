'use client';

import React, { useState } from 'react';
import { Challenge } from '../../types';
import { motion } from 'framer-motion';
import { Mic, Volume2, CheckCircle, XCircle, Lightbulb, Trophy, Clock, MessageCircle, Languages } from 'lucide-react';
import { evaluateChallenge } from '../../../../app/actions/evaluate-challenge';

interface LinguaLabProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

interface LinguaLabState {
  userResponse: string;
  isSubmitting: boolean;
  feedback: string;
  isComplete: boolean;
  isSuccess: boolean;
  showHint: boolean;
  currentHintIndex: number;
  exerciseType: 'translation' | 'conversation' | 'grammar' | 'vocabulary';
  score: number;
}

export default function LinguaLab({ challenge, onComplete }: LinguaLabProps) {
  const [state, setState] = useState<LinguaLabState>({
    userResponse: '',
    isSubmitting: false,
    feedback: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
    exerciseType: 'conversation',
    score: 0,
  });

  const handleResponseChange = (newResponse: string) => {
    setState(prev => ({ ...prev, userResponse: newResponse }));
  };

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true, feedback: '' }));

    try {
      const result = await evaluateChallenge(
        state.userResponse,
        challenge.title,
        challenge.description,
        challenge.validationCriteria,
        'language'
      );

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        feedback: result.feedback || '',
        score: result.score || 0,
        isComplete: true,
        isSuccess: result.isSuccess,
      }));

      if (onComplete) {
        onComplete(result.isSuccess);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        feedback: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{challenge.title}</h2>
              <p className="text-gray-400 text-sm">{challenge.description}</p>
            </div>
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
        {/* Left Panel - Exercise & Hints */}
        <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Language Exercise</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-gray-300 whitespace-pre-wrap flex-1">{challenge.description}</p>
                  <button
                    onClick={() => speakText(challenge.description)}
                    className="ml-2 p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors"
                    title="Listen to pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {challenge.validationCriteria.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {challenge.validationCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span className="text-gray-300">{criteria.type}: {criteria.expected || criteria.rubric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Hints */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Language Tips</h3>
                {challenge.hints.length > 0 && (
                  <button
                    onClick={showNextHint}
                    disabled={state.currentHintIndex >= challenge.hints.length - 1}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Show Tip ({state.currentHintIndex + 1}/{challenge.hints.length})
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

        {/* Middle Panel - Response Area */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Your Response</h3>
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors"
                title="Voice input (coming soon)"
                disabled
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleSubmit}
                disabled={state.isSubmitting || state.userResponse.trim().length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {state.isSubmitting ? 'Evaluating...' : 'Submit Response'}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
            <textarea
              value={state.userResponse}
              onChange={(e) => handleResponseChange(e.target.value)}
              className="w-full h-full bg-transparent text-white text-lg p-4 resize-none focus:outline-none leading-relaxed"
              placeholder="Type your response here..."
              spellCheck={true}
            />
          </div>
        </div>

        {/* Right Panel - Feedback */}
        <div className="w-1/3 p-4 border-l border-gray-700 flex flex-col">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Feedback</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
                {state.feedback && (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">{state.feedback}</div>
                )}
                {!state.feedback && (
                  <p className="text-gray-500 text-sm">Submit your response to receive detailed language feedback...</p>
                )}
              </div>
            </div>

            {/* Score Display */}
            {state.isComplete && state.score > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Language Score</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-indigo-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${state.score * 10}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-sm font-bold">{state.score}/10</span>
                </div>
              </div>
            )}
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
                <span className="font-semibold">Exercise Completed!</span>
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