use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Calculator,
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
  Clock,
  Target,
  Hash,
  RotateCcw,
  Delete,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { evaluateChallenge } from '../../../../app/actions/evaluate-challenge';
import { Challenge } from '../../types';

interface MathLabProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

/* ======================================================
   SAFE SCIENTIFIC EXPRESSION EVALUATOR
====================================================== */
function evaluateExpression(expr: string, mode: 'deg' | 'rad'): string {
  try {
    if (!expr.trim()) return '0';

    const trigWrap = (fn: string) =>
      mode === 'deg'
        ? `Math.${fn}(x * Math.PI / 180)`
        : `Math.${fn}(x)`;

    let sanitized = expr
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/√/g, 'Math.sqrt')
      .replace(/sin\(([^)]+)\)/g, (_, x) => trigWrap('sin').replace('x', x))
      .replace(/cos\(([^)]+)\)/g, (_, x) => trigWrap('cos').replace('x', x))
      .replace(/tan\(([^)]+)\)/g, (_, x) => trigWrap('tan').replace('x', x))
      .replace(/log/g, 'Math.log10')
      .replace(/ln/g, 'Math.log')
      .replace(/\^/g, '**');

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();

    if (!Number.isFinite(result)) return 'Error';
    return String(+result.toFixed(10));
  } catch {
    return 'Error';
  }
}

export default function MathLab({ challenge, onComplete }: MathLabProps) {
  /* ---------------- Core state ---------------- */
  const [answer, setAnswer] = useState('');
  const [workShown, setWorkShown] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [steps, setSteps] = useState<
    Array<{ step: string; explanation: string; correct: boolean }>
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /* ---------------- Hint state ---------------- */
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  /* ---------------- Calculator state ---------------- */
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcValue, setCalcValue] = useState('');
  const [calcMode, setCalcMode] = useState<'deg' | 'rad'>('deg');
  const [history, setHistory] = useState<string[]>([]);
  const calcInputRef = useRef<HTMLDivElement>(null);

  /* ---------------- Keyboard support ---------------- */
  useEffect(() => {
    if (!showCalculator) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalculator(false);
      if (/[\d.+\-*/()^]/.test(e.key)) {
        setCalcValue(v => v + e.key);
      }
      if (e.key === 'Enter') {
        const result = evaluateExpression(calcValue, calcMode);
        if (result !== 'Error') {
          setHistory(h => [calcValue + ' = ' + result, ...h.slice(0, 9)]);
        }
        setCalcValue(result);
      }
      if (e.key === 'Backspace') {
        setCalcValue(v => v.slice(0, -1));
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCalculator, calcValue, calcMode]);

  /* ---------------- Submit ---------------- */
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setIsSubmitting(true);

    try {
      const result = await evaluateChallenge(
        `Answer: ${answer}\n\nWork:\n${workShown}`,
        challenge.title,
        challenge.description,
        challenge.validationCriteria,
        'math'
      );

      setFeedback(result.feedback || '');
      setSteps(result.steps || []);
      setIsSuccess(result.isSuccess);
      setIsComplete(true);
      onComplete?.(result.isSuccess);
    } catch (err) {
      setFeedback('Submission failed.');
      setIsSuccess(false);
      setIsComplete(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextHint = () => {
    setShowHint(true);
    setHintIndex(i => Math.min(i + 1, challenge.hints.length - 1));
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between">
        <div>
          <h1 className="text-sm font-semibold truncate">{challenge.title}</h1>
          <p className="text-xs text-gray-400">
            <Clock className="inline w-3 h-3 mr-1" />
            {challenge.estimatedMinutes} min • {challenge.xpReward} XP
          </p>
        </div>

        <button
          onClick={() => setShowCalculator(true)}
          aria-label="Open calculator"
          className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <section className="bg-gray-800 rounded-xl p-4 text-sm">
          {challenge.description}
        </section>

        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold">Final Answer</h2>
          </div>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg p-3 font-mono text-lg"
          />
        </section>

        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold">Work Shown</h2>
          </div>
          <textarea
            value={workShown}
            onChange={e => setWorkShown(e.target.value)}
            className="w-full min-h-[140px] bg-transparent border border-gray-700 rounded-lg p-3 font-mono text-sm"
          />
        </section>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 rounded-xl font-semibold"
        >
          {isSubmitting ? 'Checking…' : 'Submit'}
        </button>

        {challenge.hints.length > 0 && (
          <section className="bg-gray-800 rounded-xl p-4">
            <button
              onClick={nextHint}
              className="flex gap-2 text-yellow-400 text-sm"
            >
              <Lightbulb className="w-4 h-4" />
              Hint {hintIndex + 1}/{challenge.hints.length}
            </button>

            {showHint && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-yellow-200"
              >
                {challenge.hints[hintIndex]}
              </motion.p>
            )}
          </section>
        )}

        {isComplete && (
          <section className="bg-gray-800 rounded-xl p-4 space-y-3">
            <p className="text-sm">{feedback}</p>

            {steps.map((s, i) => (
              <div key={i} className="flex gap-2 text-sm">
                {s.correct ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <span>{s.step}</span>
              </div>
            ))}

            {isSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Trophy className="w-4 h-4" /> Solved
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================= CALCULATOR ================= */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div
            ref={calcInputRef}
            className="w-full bg-gray-900 rounded-t-xl border-t border-gray-700 p-4"
          >
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">
                Calculator ({calcMode.toUpperCase()})
              </span>
              <button
                onClick={() => setCalcMode(m => (m === 'deg' ? 'rad' : 'deg'))}
                className="text-xs px-2 py-1 bg-gray-800 rounded"
              >
                DEG / RAD
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 font-mono text-right text-lg mb-2">
              {calcValue || '0'}
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              {[
                'sin(', 'cos(', 'tan(', '√(',
                'log(', 'ln(', 'π', '^',
                '7', '8', '9', '/',
                '4', '5', '6', '*',
                '1', '2', '3', '-',
                '0', '.', '(', ')',
              ].map(k => (
                <button
                  key={k}
                  onClick={() => setCalcValue(v => v + k)}
                  className="py-3 bg-gray-800 rounded-lg"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  const result = evaluateExpression(calcValue, calcMode);
                  if (result !== 'Error') {
                    setHistory(h => [calcValue + ' = ' + result, ...h.slice(0, 9)]);
                  }
                  setCalcValue(result);
                }}
                className="flex-1 py-3 bg-green-600 rounded-lg font-semibold"
              >
                =
              </button>

              <button
                onClick={() => setCalcValue(v => v.slice(0, -1))}
                className="p-3 bg-gray-800 rounded-lg"
              >
                <Delete className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCalcValue('')}
                className="p-3 bg-gray-800 rounded-lg"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => {
                  setAnswer(calcValue);
                  setShowCalculator(false);
                }}
                className="py-2 bg-indigo-600 rounded-lg text-sm"
              >
                Use as Answer
              </button>
              <button
                onClick={() => {
                  setWorkShown(w => w + `\n${calcValue}`);
                  setShowCalculator(false);
                }}
                className="py-2 bg-indigo-600/70 rounded-lg text-sm"
              >
                Add to Work
              </button>
            </div>

            {history.length > 0 && (
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setCalcValue(h.split('=')[0].trim())}
                    className="block text-left w-full"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
