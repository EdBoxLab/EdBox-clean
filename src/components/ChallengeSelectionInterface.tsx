'use client';

import React, { useState, useEffect } from 'react';
import { useChallengeGenerator } from '@/lib/hooks/useChallengeGenerator';
import { useProgressTracker } from '@/lib/hooks/useProgressTracker';
import type { GeneratedChallenge, DifficultyLevel } from '@/types/skill-progression';

interface ChallengeSelectionInterfaceProps {
  skillId: string;
  skillTitle: string;
  difficultyLevel: DifficultyLevel;
  onChallengeSelect: (challenge: GeneratedChallenge) => void;
  onClose?: () => void;
  userId?: string; // Optional for progress tracking
}

export function ChallengeSelectionInterface({
  skillId,
  skillTitle,
  difficultyLevel,
  onChallengeSelect,
  onClose,
  userId
}: ChallengeSelectionInterfaceProps) {
  const {
    challenges,
    loading,
    error,
    getChallengePool,
    ensurePoolSize,
    generateChallenge
  } = useChallengeGenerator();

  const {
    progressData,
    loading: progressLoading,
    getProgressDisplayData
  } = useProgressTracker(skillId, skillTitle);

  const [selectedChallenge, setSelectedChallenge] = useState<GeneratedChallenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load existing challenges and ensure minimum pool size
    const initializeChallenges = async () => {
      await getChallengePool(skillId);
      await ensurePoolSize(skillId, 3);
    };

    initializeChallenges();
  }, [skillId, getChallengePool, ensurePoolSize]);

  useEffect(() => {
    // Progress data is automatically loaded by the hook when skillId and skillTitle are provided
    // No additional action needed here since the hook handles it
  }, []);

  const handleGenerateNew = async () => {
    // Prevent generating too many challenges (max 10)
    if (challenges.length >= 10) {
      return;
    }
    
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

  const getDifficultyIcon = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Easy': return '●';
      case 'Medium': return '●●';
      case 'Hard': return '●●●';
      default: return '●';
    }
  };

  const isChallengeCompleted = (challengeId: string) => {
    return completedChallenges.has(challengeId);
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
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{skillTitle}</h2>
          <p className="text-gray-600 mt-1">Choose a challenge to practice this skill</p>
          
          {/* Progress Tracking UI */}
          {userId && progressData && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress to Mastery</span>
                <span className="text-sm text-gray-600">
                  {progressData.challengesCompleted}/{progressData.challengesRequired} challenges
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressData.progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Success Rate: {Math.round(progressData.successRate * 100)}%</span>
                <span>XP Earned: {progressData.xpEarned}</span>
                {progressData.masteryAchieved && (
                  <span className="text-green-600 font-medium">✓ Mastered</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
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
        {challenges.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No challenges available yet.</p>
            <p className="text-sm mt-1">Click "Generate New Challenge" to create some!</p>
          </div>
        ) : (
          challenges.map((challenge, index) => {
            const isCompleted = isChallengeCompleted(challenge.id);
            const isSelected = selectedChallenge?.id === challenge.id;
            
            return (
              <div
                key={challenge.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isCompleted
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleChallengeClick(challenge)}
              >
                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {challenge.title}
                      </h3>
                      
                      {/* Enhanced Difficulty Indicator */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getDifficultyColor(challenge.difficultyLevel)}`}>
                        <span className="text-xs">{getDifficultyIcon(challenge.difficultyLevel)}</span>
                        <span>{challenge.difficultyLevel}</span>
                      </div>
                      
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ~{challenge.estimatedTime} min
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-2 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                      {challenge.description}
                    </p>
                    
                    {/* Learning Objectives */}
                    {challenge.learningObjectives.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">You'll learn:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {challenge.learningObjectives.slice(0, 2).map((objective, idx) => (
                            <li key={idx}>{objective}</li>
                          ))}
                          {challenge.learningObjectives.length > 2 && (
                            <li className="text-gray-500">+{challenge.learningObjectives.length - 2} more...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Challenge Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{challenge.hints.length} hints</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{challenge.validationCriteria.length} criteria</span>
                      </div>
                      
                      {isCompleted && (
                        <span className="text-green-600 font-medium">✓ Completed</span>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="ml-4 text-blue-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateNew}
            disabled={loading || challenges.length >= 10}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={challenges.length >= 10 ? 'Maximum of 10 challenges reached' : 'Generate a new challenge'}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Generating...</span>
              </div>
            ) : (
              'Generate New Challenge'
            )}
          </button>
          
          {challenges.length >= 10 && (
            <span className="text-xs text-gray-500">
              Max challenges reached
            </span>
          )}
        </div>

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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Challenge
          </button>
        </div>
      </div>

      {/* Challenge Count Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-4">
          <span>
            {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
          </span>
          
          {challenges.length > 0 && (
            <>
              <span>•</span>
              <span>
                {completedChallenges.size} completed
              </span>
            </>
          )}
          
          {challenges.length >= 3 && challenges.length < 10 && (
            <>
              <span>•</span>
              <span className="text-blue-600">
                {10 - challenges.length} more can be generated
              </span>
            </>
          )}
        </div>
        
        {challenges.length < 3 && (
          <div className="mt-2 text-xs text-amber-600">
            Minimum 3 challenges recommended for effective practice
          </div>
        )}
      </div>
    </div>
  );
}