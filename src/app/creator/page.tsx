'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingFlow } from './hooks/useOnboardingFlow';
import Step1Goal from './components/Step1Goal';
import Step2Context from './components/Step2Context';
import Step3Time from './components/Step3Time';
import GeneratingView from './components/GeneratingView';

export default function OnboardingFlow() {
  const {
    step,
    goal,
    context,
    timeAvailable,
    uploadedFile,
    isGenerating,
    error,
    showContinue,
    setGoal,
    setContext,
    setTimeAvailable,
    handleFileUpload,
    nextStep,
    prevStep
  } = useOnboardingFlow();

  if (isGenerating) {
    return <GeneratingView isGenerating={isGenerating} />;
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white rounded-3xl">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          {/* Progress Dots */}
          <div className="flex gap-2 ml-auto">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`h-2 rounded-full transition-all ${dot === step
                    ? 'w-8 bg-blue-500'
                    : dot < step
                      ? 'w-2 bg-blue-500'
                      : 'w-2 bg-gray-700'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1Goal
              key="step1"
              goal={goal}
              setGoal={setGoal}
              uploadedFile={uploadedFile}
              handleFileUpload={handleFileUpload}
            />
          )}
          {step === 2 && (
            <Step2Context
              key="step2"
              context={context}
              setContext={setContext}
            />
          )}
          {step === 3 && (
            <Step3Time
              key="step3"
              timeAvailable={timeAvailable}
              setTimeAvailable={setTimeAvailable}
            />
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-200 flex items-center gap-3"
            >
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <AnimatePresence>
          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <motion.button
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all"
              >
                {step === 3 ? "Let's Go! 🚀" : "Continue →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip (only on step 1) */}
        {step === 1 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-5 bg-gray-800/50 rounded-2xl border border-gray-700"
          >
            <p className="text-sm text-gray-400">
              <span className="font-bold text-white">💡 Pro tip:</span> The more specific you are, the better!
              Instead of "learn coding", try "build a personal portfolio website" or "create an AI chatbot".
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}