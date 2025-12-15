
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Volume2,
  Lightbulb,
  Trophy,
  Clock,
  Languages,
} from 'lucide-react';
import { evaluateChallenge } from '../../../../app/actions/evaluate-challenge';
import { Challenge } from '../../types';

interface LinguaLabProps {
  challenge: Challenge;
  onComplete?: (success: boolean) => void;
}

export default function LinguaLab({ challenge, onComplete }: LinguaLabProps) {
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const micSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const handleSubmit = async () => {
    if (!userResponse.trim()) return;

    setIsSubmitting(true);
    setFeedback('');

    try {
      const result = await evaluateChallenge(
        userResponse,
        challenge.title,
        challenge.description,
        challenge.validationCriteria,
        'language'
      );

      setFeedback(result.feedback || '');
      setScore(result.score || 0);
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

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const startRecording = () => {
    if (!micSupported || isRecording) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;

    setIsRecording(true);

    recognition.onresult = (e: any) => {
      setUserResponse(prev =>
        prev ? `${prev} ${e.results[0][0].transcript}` : e.results[0][0].transcript
      );
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
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
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Languages className="w-4 h-4" />
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
        {/* Prompt */}
        <section className="bg-gray-800 rounded-xl p-4">
          <div className="flex gap-2">
            <p className="text-sm leading-relaxed flex-1">
              {challenge.description}
            </p>
            <button
              onClick={() => speakText(challenge.description)}
              aria-label="Listen"
              className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-900/30"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Response */}
        <section className="bg-gray-800 rounded-xl p-3">
          <textarea
            value={userResponse}
            onChange={e => setUserResponse(e.target.value)}
            placeholder="Type your response…"
            className="w-full min-h-[160px] bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
          />

          <div className="flex justify-end pt-2">
            <button
              onClick={startRecording}
              disabled={!micSupported || isRecording}
              aria-pressed={isRecording}
              className={`p-2 rounded-lg ${
                isRecording
                  ? 'text-red-400 animate-pulse'
                  : 'text-indigo-400'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !userResponse.trim()}
          className="w-full py-3 rounded-xl bg-indigo-600 font-semibold disabled:bg-gray-600"
        >
          {isSubmitting ? 'Evaluating…' : 'Submit'}
        </button>

        {/* Hints */}
        {challenge.hints.length > 0 && (
          <section className="bg-gray-800 rounded-xl p-4">
            <button
              onClick={showNextHint}
              disabled={hintIndex >= challenge.hints.length - 1}
              className="flex items-center gap-2 text-sm text-yellow-400"
            >
              <Lightbulb className="w-4 h-4" />
              Show tip ({hintIndex + 1}/{challenge.hints.length})
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

            {score > 0 && (
              <div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-gray-400">
                  Score: {score}/10
                </p>
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Trophy className="w-4 h-4" />
                Completed • {challenge.xpReward} XP earned
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
