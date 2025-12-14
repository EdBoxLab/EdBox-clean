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
  isRecording: boolean;
  micSupported: boolean;
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
    isRecording: false,
    micSupported: typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
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

  const startVoiceRecording = () => {
    if (!state.micSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-ES'; // Default to Spanish, could be dynamic based on challenge
    
    setState(prev => ({ ...prev, isRecording: true }));
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setState(prev => ({ 
        ...prev, 
        userResponse: prev.userResponse + (prev.userResponse ? ' ' : '') + transcript,
        isRecording: false 
      }));
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState(prev => ({ ...prev, isRecording: false }));
    };
    
    recognition.onend = () => {
      setState(prev => ({ ...prev, isRecording: false }));
    };
    
    recognition.start();
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Languages className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">{challenge.title}</h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">{challenge.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
            <div className="flex items-center gap-1 text-blue-400">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{challenge.estimatedMinutes}m</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{challenge.xpReward} XP</span>
            </div>
            <div className="px-2 py-1 bg-gray-700 rounded text-xs">
              {challenge.difficulty}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Exercise & Hints */}
        <div className="w-full lg:w-1/3 p-3 sm:p-4 border-b lg:border-r lg:border-b-0 border-gray-700 overflow-y-auto max-h-48 lg:max-h-none">
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Language Exercise</h3>
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-gray-300 whitespace-pre-wrap flex-1 text-sm sm:text-base">{challenge.description}</p>
                  <button
                    onClick={() => speakText(challenge.description)}
                    className="ml-2 p-1.5 sm:p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors shrink-0"
                    title="Listen to pronunciation"
                  >
                    <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                
                {/* Spanish Alphabet Helper */}
                {(challenge.title.toLowerCase().includes('alphabet') || challenge.title.toLowerCase().includes('letters') || challenge.description.toLowerCase().includes('alphabet')) && (
                  <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-600/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-indigo-300 mb-2">Spanish Alphabet Reference</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        'A (ah)', 'B (beh)', 'C (seh)', 'D (deh)', 'E (eh)', 'F (eh-feh)',
                        'G (heh)', 'H (ah-cheh)', 'I (ee)', 'J (ho-tah)', 'K (kah)', 'L (eh-leh)',
                        'M (eh-meh)', 'N (eh-neh)', 'Ñ (eh-nyeh)', 'O (oh)', 'P (peh)', 'Q (koo)',
                        'R (eh-rreh)', 'S (eh-seh)', 'T (teh)', 'U (oo)', 'V (veh)', 'W (do-bleh veh)',
                        'X (eh-kees)', 'Y (ee gree-eh-gah)', 'Z (seh-tah)'
                      ].map((letter, idx) => (
                        <button
                          key={idx}
                          onClick={() => speakText(letter.split(' ')[0])}
                          className="p-1 bg-gray-700 hover:bg-indigo-600 rounded text-center transition-colors"
                          title={`Click to hear pronunciation`}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
        <div className="w-full lg:w-1/2 p-3 sm:p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Your Response</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={startVoiceRecording}
                disabled={!state.micSupported || state.isRecording}
                className={`p-2 rounded transition-colors ${
                  state.isRecording 
                    ? 'text-red-400 bg-red-900/20 animate-pulse' 
                    : state.micSupported 
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20' 
                      : 'text-gray-500 cursor-not-allowed'
                }`}
                title={state.micSupported ? (state.isRecording ? 'Recording...' : 'Voice input') : 'Microphone not supported'}
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

          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden min-h-48 lg:min-h-0">
            <textarea
              value={state.userResponse}
              onChange={(e) => handleResponseChange(e.target.value)}
              className="w-full h-full bg-transparent text-white text-sm sm:text-lg p-3 sm:p-4 resize-none focus:outline-none leading-relaxed"
              placeholder={state.micSupported ? "Type your response here or use the microphone button above..." : "Type your response here..."}
              spellCheck={true}
            />
          </div>
        </div>

        {/* Right Panel - Feedback */}
        <div className="w-full lg:w-1/3 p-3 sm:p-4 border-t lg:border-l lg:border-t-0 border-gray-700 flex flex-col min-h-0">
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