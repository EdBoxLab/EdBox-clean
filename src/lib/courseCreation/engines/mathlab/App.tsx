
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
  Clock,
  Target,
  Hash,
} from 'lucide-react';
import { evaluateChallenge } from '../../../../app/actions/evaluate-challenge';
import { Challenge } from '../../types';

interface MathLabProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

export default function MathLab({ challenge, onComplete }: MathLabProps) {
  const [answer, setAnswer] = useState('');
  const [workShown, setWorkShown] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [steps, setSteps] = useState<
    Array<{ step: string; explanation: string; correct: boolean }>
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setFeedback('');
    setSteps([]);

    try {
      const input = `Answer: ${answer}\n\nWork Shown:\n${workShown}`;

      const result = await evaluateChallenge(
        input,
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
      setFeedback(
        err instanceof Error ? err.message : 'Something went wrong'
      );
      setIsComplete(true);
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNextHint = () => {
    setShowHint(true);
    setHintIndex(i => Math.min(i + 1, challenge.hints.length - 1));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">
              {challenge.title}
            </h1>
            <p className="text-xs text-gray-400">
              <Clock className="inline w-3 h-3 mr-1" />
              {challenge.estimatedMinutes} min • {challenge.xpReward} XP
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Problem */}
        <section className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-2">Problem</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {challenge.description}
          </p>
        </section>

        {/* Requirements */}
        {challenge.validationCriteria.length > 0 && (
          <section className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">Requirements</h2>
            <ul className="space-y-1 text-sm text-gray-300">
              {challenge.validationCriteria.map((c, i) => (
                <li key={i}>
                  • {c.type}: {c.expected || c.rubric}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Answer */}
        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold">Final Answer</h2>
          </div>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Enter your final answer…"
            className="w-full bg-transparent border border-gray-700 rounded-lg p-3 text-lg font-mono focus:outline-none focus:border-green-500"
          />
        </section>

        {/* Work */}
        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold">Show Your Work</h2>
          </div>
          <textarea
            value={workShown}
            onChange={e => setWorkShown(e.target.value)}
            placeholder="Show your steps…"
            className="w-full min-h-[140px] bg-transparent border border-gray-700 rounded-lg p-3 font-mono text-sm resize-none focus:outline-none focus:border-green-500"
          />
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !answer.trim()}
          className="w-full py-3 rounded-xl bg-green-600 font-semibold disabled:bg-gray-600"
        >
          {isSubmitting ? 'Checking…' : 'Submit Solution'}
        </button>

        {/* Hints */}
        {challenge.hints.length > 0 && (
          <section className="bg-gray-800 rounded-xl p-4">
            <button
              onClick={showNextHint}
              disabled={hintIndex >= challenge.hints.length - 1}
              className="flex items-center gap-2 text-yellow-400 text-sm"
            >
              <Lightbulb className="w-4 h-4" />
              Show hint ({hintIndex + 1}/{challenge.hints.length})
            </button>

            {showHint && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-yellow-200"
              >
                {challenge.hints[hintIndex]}
              </motion.p>
            )}
          </section>
        )}

        {/* Feedback */}
        {isComplete && (
          <section
            aria-live="polite"
            className="bg-gray-800 rounded-xl p-4 space-y-3"
          >
            <p className="text-sm whitespace-pre-wrap">{feedback}</p>

            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 p-3 rounded-lg ${
                      s.correct
                        ? 'bg-green-900/20 border border-green-600/30'
                        : 'bg-red-900/20 border border-red-600/30'
                    }`}
                  >
                    {s.correct ? (
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Step {i + 1}: {s.step}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Trophy className="w-4 h-4" />
                Solved • {challenge.xpReward} XP earned
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
