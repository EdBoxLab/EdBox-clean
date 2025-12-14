'use client';

import React, { useState, useEffect } from 'react';
import { useChallengeGenerator } from '@/lib/hooks/useChallengeGenerator';
import type { GeneratedChallenge, DifficultyLevel } from '@/types/skill-progression';

interface ChallengeSelectionInterfaceProps {
  skillId: string;
  skillTitle: string;
  difficultyLevel: DifficultyLevel;
  onChallengeSelect: (challenge: GeneratedChallenge) => void;
  onClose?: () => void;
}

export function ChallengeSelectionInterface({
  skillId,
  skillTitle,
  difficultyLevel,
  onChallengeSelect,
  onClose
}: ChallengeSelectionInterfaceProps) {
  const {
    challenges,
    loading,
    error,
    getChallengePool,
    ensurePoolSize,
    generateChallenge
  } = useChallengeGenerator();

  const [selectedChallenge, setSelectedChallenge] = useState<GeneratedChallenge | null>(null);

  useEffect(() => {
    // Load existing challenges and ensure minimum pool size
    const initializeChallenges = async () => {
      await getChallengePool(skillId);
      await ensurePoolSize(skillId, 3);
    };

    initializeChallenges();
  }, [skillId, getChallengePool, ensurePoolSize]);

  const handleGenerateNew = async () => {
    await generateChallenge({
      skillId,
      difficultyLevel,
      challengeType: 'programming' // Could be dynamic based on skill
    });
  };

  const handleChallengeClick = (challenge: GeneratedChallenge) => {
    setSelectedChallenge(challenge);
  };

  const handleStartChallenge = () => {
    if (selectedChallenge) {
      onChallengeSelect(selectedChallenge);
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && challenges.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading challenges...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{skillTitle}</h2>
          <p className="text-gray-600 mt-1">Choose a challenge to practice this skill</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Challenge List */}
      <div className="grid gap-4 mb-6">
        {challenges.map((challenge, index) => (
          <div
            key={challenge.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedChallenge?.id === challenge.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleChallengeClick(challenge)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficultyLevel)}`}>
                    {challenge.difficultyLevel}
                  </span>
                  <span className="text-xs text-gray-500">
                    ~{challenge.estimatedTime} min
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{challenge.description}</p>
                
                {/* Learning Objectives */}
                {challenge.learningObjectives.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">You'll learn:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {challenge.learningObjectives.slice(0, 2).map((objective, idx) => (
                        <li key={idx}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints Preview */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{challenge.hints.length} hints available</span>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedChallenge?.id === challenge.id && (
                <div className="ml-4 text-blue-600">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleGenerateNew}
          disabled={loading}
          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate New Challenge'}
        </button>

        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleStartChallenge}
            disabled={!selectedChallenge}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Challenge
          </button>
        </div>
      </div>

      {/* Challenge Count Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}