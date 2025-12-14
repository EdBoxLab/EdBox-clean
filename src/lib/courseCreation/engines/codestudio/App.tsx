'use client';

import React, { useState } from 'react';
import { Challenge } from '../../types';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Lightbulb, Trophy, Clock, Code, Terminal } from 'lucide-react';
import { evaluateChallenge } from '@/app/actions/evaluate-challenge';

interface CodeStudioProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

interface CodeStudioState {
  code: string;
  isRunning: boolean;
  output: string;
  isComplete: boolean;
  isSuccess: boolean;
  showHint: boolean;
  currentHintIndex: number;
  testResults: Array<{ test: string; passed: boolean; message: string }>;
}

export default function CodeStudio({ challenge, onComplete }: CodeStudioProps) {
  const [state, setState] = useState<CodeStudioState>({
    code: challenge.starterCode || '// Write your code here\nfunction solution() {\n  // Your implementation\n}\n',
    isRunning: false,
    output: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
    testResults: [],
  });

  const handleCodeChange = (newCode: string) => {
    setState(prev => ({ ...prev, code: newCode }));
  };

  const handleRun = async () => {
    setState(prev => ({ ...prev, isRunning: true, output: '', testResults: [] }));

    try {
      const result = await evaluateChallenge(
        state.code,
        challenge.title,
        challenge.description,
        challenge.validationCriteria
      );

      setState(prev => ({
        ...prev,
        isRunning: false,
        output: result.output,
        testResults: result.testResults,
        isComplete: result.isComplete,
        isSuccess: result.isSuccess,
      }));

      if (onComplete) {
        onComplete(result.isSuccess);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRunning: false,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{challenge.title}</h2>
              <p className="text-gray-400 text-sm">{challenge.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-blue-400">
              <Clock className="w-4 h-4" />
              <span>{challenge.estimatedMinutes || 15}m</span>
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
              <h3 className="text-lg font-semibold mb-2">Challenge</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
              </div>
            </div>

            {/* Validation Criteria */}
            {challenge.validationCriteria.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {challenge.validationCriteria.map((criteria, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-400 mt-1">•</span>
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

        {/* Middle Panel - Code Editor */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Code Editor</h3>
            <button
              onClick={handleRun}
              disabled={state.isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              {state.isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>

          <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
            <textarea
              value={state.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full bg-transparent text-white font-mono text-sm p-4 resize-none focus:outline-none"
              placeholder="// Write your code here..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Panel - Output & Results */}
        <div className="w-1/3 p-4 border-l border-gray-700 flex flex-col">
          <div className="flex-1 space-y-4">
            {/* Output */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Output</h3>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 h-32 overflow-y-auto">
                {/* Feedback & Output Display */}
                {state.isComplete ? (
                  <div className="space-y-4">
                    {/* Overall feedback */}
                    {state.isSuccess ? (
                      <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                        <h4 className="font-bold text-green-400 mb-1">Success!</h4>
                        <p className="text-sm text-gray-300">{state.testResults[0]?.message || "Great job! You solved the challenge."}</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                        <h4 className="font-bold text-red-400 mb-1">Not quite there yet</h4>
                        <p className="text-sm text-gray-300">Check the test results below or try a hint.</p>
                      </div>
                    )}

                    {/* Console Output */}
                    {state.output && state.output !== 'Code executed successfully' && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Console Output</h4>
                        <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap bg-black/30 p-2 rounded">{state.output}</pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Run your code to see results...</p>
                )}
              </div>
            </div>

            {/* Test Results */}
            {state.testResults.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Test Results</h3>
                <div className="space-y-2">
                  {state.testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-3 rounded-lg ${result.passed ? 'bg-green-900/20 border border-green-600/30' : 'bg-red-900/20 border border-red-600/30'
                        }`}
                    >
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {result.test}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{result.message}</p>
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