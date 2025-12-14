'use client';

import React, { useState } from 'react';
import { Challenge } from '@/lib/courseCreation/types';
import { motion } from 'framer-motion';
import { Send, CheckCircle, XCircle, Lightbulb, Trophy, Clock, PenTool, FileText } from 'lucide-react';
import { callGroq } from '../shared/groqService';

interface WritingStudioProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

interface WritingStudioState {
  content: string;
  isSubmitting: boolean;
  feedback: string;
  isComplete: boolean;
  isSuccess: boolean;
  showHint: boolean;
  currentHintIndex: number;
  wordCount: number;
}

export default function WritingStudio({ challenge, onComplete }: WritingStudioProps) {
  const [state, setState] = useState<WritingStudioState>({
    content: challenge.starterCode || '',
    isSubmitting: false,
    feedback: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
    wordCount: 0,
  });

  const handleContentChange = (newContent: string) => {
    const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    setState(prev => ({ ...prev, content: newContent, wordCount }));
  };

  const handleSubmit = async () => {
    setState(prev => ({ ...prev, isSubmitting: true, feedback: '' }));
    
    try {
      const systemPrompt = `You are a writing evaluation assistant. Evaluate the provided writing against the challenge requirements.

Challenge: ${challenge.title}
Description: ${challenge.description}
Validation Criteria: ${JSON.stringify(challenge.validationCriteria)}

Analyze the writing and return a JSON response with:
{
  "success": boolean,
  "feedback": "detailed constructive feedback on the writing",
  "strengths": ["list of strengths"],
  "improvements": ["list of areas for improvement"],
  "score": number (1-10)
}

Provide thorough, constructive feedback that helps the writer improve.`;

      const userPrompt = `Evaluate this writing:

"${state.content}"

Check if it meets the challenge requirements and provide detailed feedback.`;

      const response = await callGroq(systemPrompt, userPrompt);
      
      try {
        const result = JSON.parse(response);
        
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          feedback: result.feedback || response,
          isComplete: true,
          isSuccess: result.success || (result.score >= 7),
        }));
        
        if (onComplete) {
          onComplete(result.success || (result.score >= 7));
        }
      } catch (parseError) {
        const success = response.toLowerCase().includes('good') || response.toLowerCase().includes('excellent');
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
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <PenTool className="w-5 h-5" />
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
        {/* Left Panel - Challenge & Hints */}
        <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Writing Prompt</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
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
                        <span className="text-purple-400 mt-1">•</span>
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
                <h3 className="text-lg font-semibold">Writing Tips</h3>
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

        {/* Middle Panel - Writing Area */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Your Writing</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {state.wordCount} words
              </span>
              <button
                onClick={handleSubmit}
                disabled={state.isSubmitting || state.content.trim().length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
              >
                <Send className="w-4 h-4" />
                {state.isSubmitting ? 'Evaluating...' : 'Submit Writing'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
            <textarea
              value={state.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full bg-transparent text-white text-base p-4 resize-none focus:outline-none leading-relaxed"
              placeholder="Start writing here..."
              spellCheck={true}
            />
          </div>
        </div>

        {/* Right Panel - Feedback */}
        <div className="w-1/3 p-4 border-l border-gray-700 flex flex-col">
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Feedback</h3>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto">
                {state.feedback && (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">{state.feedback}</div>
                )}
                {!state.feedback && (
                  <p className="text-gray-500 text-sm">Submit your writing to receive detailed feedback...</p>
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
                <span className="font-semibold">Writing Challenge Completed!</span>
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