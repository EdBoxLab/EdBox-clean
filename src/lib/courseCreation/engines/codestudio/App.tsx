'use client';

import React, { useState, useRef } from 'react';
import { Challenge } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, XCircle, Lightbulb, Trophy, Clock, Code, Terminal, ChevronRight, Keyboard } from 'lucide-react';
import { evaluateChallenge } from '../../../../app/actions/evaluate-challenge';

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
  activeTab: 'editor' | 'output';
}

export default function CodeStudio({ challenge, onComplete }: CodeStudioProps) {
  const [state, setState] = useState<CodeStudioState>({
    code: challenge.starterCode || '// Step 1: Define your function here\nfunction solution() {\n  // Your implementation\n}\n',
    isRunning: false,
    output: '',
    isComplete: false,
    isSuccess: false,
    showHint: false,
    currentHintIndex: 0,
    testResults: [],
    activeTab: 'editor',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCodeChange = (newCode: string) => {
    setState(prev => ({ ...prev, code: newCode }));
  };

  const insertSymbol = (symbol: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentCode = state.code;
    const newCode = currentCode.substring(0, start) + symbol + currentCode.substring(end);
    handleCodeChange(newCode);

    // Set focus and cursor position after insertion
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 0);
  };

  const handleRun = async () => {
    setState(prev => ({ ...prev, isRunning: true, output: '', testResults: [], activeTab: 'output' }));

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
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950">
      {/* Mobile Tab Switcher */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'editor' }))}
          className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${state.activeTab === 'editor' ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-gray-500'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Code className="w-4 h-4" />
            <span>EDITOR</span>
          </div>
        </button>
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'output' }))}
          className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${state.activeTab === 'output' ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-gray-500'
            }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>OUTPUT</span>
            {state.isComplete && (
              <div className={`w-2 h-2 rounded-full ${state.isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
            )}
          </div>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Editor Pane */}
        <div className={`flex-1 flex flex-col min-h-0 ${state.activeTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          {/* Tooltips/Scaffolding Area */}
          <div className="px-4 py-2 bg-indigo-950/20 border-b border-indigo-500/20 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
            <p className="text-xs text-indigo-300 font-medium">Tip: {challenge.description.split('.')[0]}.</p>
          </div>

          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={state.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full bg-transparent text-gray-100 font-mono text-base p-6 resize-none focus:outline-none selection:bg-indigo-500/30"
              placeholder="// Write your code here..."
              spellCheck={false}
            />

            {/* Symbol Bar - Mobile Optimization */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['{', '}', '(', ')', '[', ']', ';', '.', '=', '!', '>', '<'].map(sym => (
                <button
                  key={sym}
                  onClick={() => insertSymbol(sym)}
                  className="flex-shrink-0 w-10 h-10 bg-gray-800/80 backdrop-blur border border-gray-700 rounded-xl flex items-center justify-center font-mono font-bold text-indigo-400 hover:bg-gray-700 active:scale-90 transition-all"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Pane */}
        <div className={`flex-1 md:w-80 md:border-l border-gray-800 bg-gray-900/30 flex flex-col min-h-0 ${state.activeTab === 'output' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            {/* Concept Brief (Desktop Only Placeholder or Small Collapsible) */}
            <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">The Mission</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{challenge.description}</p>
            </div>

            {/* Test Results */}
            <div>
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Verification</h4>
              {!state.isComplete && !state.isRunning ? (
                <div className="text-center py-8">
                  <Terminal className="w-12 h-12 text-gray-700 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-gray-500">Run code to see results</p>
                </div>
              ) : state.isRunning ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"
                  />
                  <p className="text-sm text-indigo-400 font-bold animate-pulse">EVALUATING...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.testResults.map((result, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${result.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                        }`}
                    >
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {result.test}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{result.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Hints Section */}
            {challenge.hints.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={showNextHint}
                  disabled={state.currentHintIndex >= challenge.hints.length - 1}
                  className="w-full py-3 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between text-yellow-500 hover:bg-yellow-500/20 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm font-bold tracking-tight">Need a Hint?</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {state.showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-gray-800 rounded-xl border border-gray-700"
                  >
                    <p className="text-sm text-yellow-200/80 leading-relaxed italic">
                      "{challenge.hints[state.currentHintIndex]}"
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center gap-3">
        <div className="flex-1 text-xs text-gray-500 font-medium">
          {state.isComplete ? (
            <span className={state.isSuccess ? 'text-green-500' : 'text-red-500'}>
              {state.isSuccess ? 'SUCCESS: Mission accomplished' : 'FAILED: Try again'}
            </span>
          ) : (
            <span>Ready for evaluation</span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRun}
          disabled={state.isRunning}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm tracking-widest transition-all shadow-lg ${state.isRunning ? 'bg-gray-800 text-gray-600' : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500'
            }`}
        >
          {state.isRunning ? 'RUNNING' : 'RUN CODE'}
          {!state.isRunning && <Play className="w-4 h-4 fill-current" />}
        </motion.button>
      </div>

    </div>
  );
}
