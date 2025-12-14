'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/courseCreation/types';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle, XCircle, Lightbulb, Trophy, Clock, Hash, Target } from 'lucide-react';
import { callGroq } from '../shared/groqService';

interface MathLabProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

interface MathLabState {
  answer: string;
  workShown: string;
  isSubmitting: boolean;
  feedback: string;
  isComplete: boolean;
  isSuccess: boolean;
  showHint: boolean;
  currentHintIndex: number;
  steps: Array<{ step: string; explanation: string; correct: boolean }>;
}

export default function MathLab({ challenge, onComplete }: MathLabProps) {
  const [state, setState] = useState<MathLabState>({
    answer: '',
    workShown: '',
    isSubmitting: false,
    feedback: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
    steps: [],
  });

  const handleAnswerChange = (newAnswer: string) => {
    setState(prev => ({ ...prev, answer: newAnswer }));
  };

  const handleWorkChange = (newWork: string) => {
    setState(prev => ({ ...prev, workShown: newWork }));
  };

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true, feedback: '', steps: [] }));
    
    try {
      const systemPrompt = `You are a mathematics evaluation assistant. Evaluate the provided mathematical solution against the challenge requirements.

Challenge: ${challenge.title}
Description: ${challenge.description}
Validation Criteria: ${JSON.stringify(challenge.validationCriteria)}

Analyze the mathematical work and return a JSON response with:
{
  "success": boolean,
  "feedback": "detailed feedback on the mathematical solution",
  "correctAnswer": "the correct answer if different",
  "steps": [
    {"step": "step description", "explanation": "why this step is correct/incorrect", "correct": boolean}
  ],
  "score": number (1-10)
}

Focus on mathematical accuracy, proper methodology, and clear reasoning.`;

      const userPrompt = `Evaluate this mathematical solution:

Problem: ${challenge.description}

Student's Answer: ${state.answer}

Student's Work:
${state.workShown}

Check if the solution is mathematically correct and provide detailed feedback.`;

      const response = await callGroq(systemPrompt, userPrompt);
      
      try {
        const result = JSON.parse(response);
        
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          feedback: result.feedback || response,
          steps: result.steps || [],
          isComplete: true,
          isSuccess: result.success || (result.score >= 7),
        }));
        
        if (onComplete) {
          onComplete(result.success || (result.score >= 7));
        }
      } catch (parseError) {
        const success = response.toLowerCase().includes('correct') || response.toLowerCase().includes('right');
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          feedback: response,
          isComplete: true,
          isSuccess: success,
        }));
        
        if (onComplete) {
          onComplete(success);
        }
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

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5" />
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
        {/* Left Panel - Problem & Hints */}
        <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Problem</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap text-lg leading-relaxed">{challenge.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {challenge.validationCriteria.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {challenge.validationCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-400 mt-1">•</span>
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
                <h3 className="text-lg font-semibold">Hints</h3>
                {challenge.hints.length > 0 && (
                  <button
                    onClick={showNextHint}
                    disabled={state.currentHintIndex >= challenge.hints.length - 1}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Show Hint ({state.currentHintIndex + 1}/{challenge.hints.length})
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

        {/* Middle Panel - Solution Area */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="space-y-4">
            {/* Answer Input */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold">Final Answer</h3>
              </div>
              <input
                type="text"
                value={state.answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="w-full bg-gray-800 text-white text-xl p-4 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none font-mono"
                placeholder="Enter your final answer..."
              />
            </div>

            {/* Work Area */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold">Show Your Work</h3>
              </div>
              <textarea
                value={state.workShown}
                onChange={(e) => handleWorkChange(e.target.value)}
                className="w-full h-64 bg-gray-800 text-white p-4 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none font-mono resize-none"
                placeholder="Show your mathematical work step by step..."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={state.isSubmitting || state.answer.trim().length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Calculator className="w-5 h-5" />
              {state.isSubmitting ? 'Checking Solution...' : 'Submit Solution'}
            </button>
          </div>
        </div>

        {/* Right Panel - Feedback & Steps */}
        <div className="w-1/3 p-4 border-l border-gray-700 flex flex-col">
          <div className="flex-1 space-y-4">
            {/* Feedback */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Feedback</h3>
              <div className="bg-gray-800 rounded-lg p-4 h-32 overflow-y-auto">
                {state.feedback && (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">{state.feedback}</div>
                )}
                {!state.feedback && (
                  <p className="text-gray-500 text-sm">Submit your solution to receive feedback...</p>
                )}
              </div>
            </div>

            {/* Step Analysis */}
            {state.steps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Step Analysis</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-3 rounded-lg ${
                        step.correct ? 'bg-green-900/20 border border-green-600/30' : 'bg-red-900/20 border border-red-600/30'
                      }`}
                    >
                      {step.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${step.correct ? 'text-green-400' : 'text-red-400'}`}>
                          Step {index + 1}: {step.step}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{step.explanation}</p>
                      </div>
                    </div>
                  ))}
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
                <span className="font-semibold">Problem Solved!</span>
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