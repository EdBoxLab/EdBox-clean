// ============================================
// Progress Tracker React Hook
// Provides easy access to progress tracking functionality in React components
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type {
  ProgressSummary,
  ChallengeResult,
  DifficultyLevel
} from '@/types/skill-progression';
import type { SkillGraph } from '@/lib/services/skill-progression-manager';

/**
 * Progress display data for UI components
 */
interface ProgressDisplayData {
  skillId: string;
  title: string;
  progressPercentage: number;
  challengesCompleted: number;
  challengesRequired: number;
  successRate: number;
  masteryAchieved: boolean;
  xpEarned: number;
  totalAttempts: number;
  lastAttempt?: Date;
  state: 'locked' | 'unlocked' | 'mastered';
  estimatedTimeToMastery?: number;
  recentPerformance: {
    trend: 'improving' | 'stable' | 'declining';
    streakLength: number;
  };
}

/**
 * Hook state for progress tracking
 */
interface UseProgressTrackerState {
  loading: boolean;
  error: string | null;
  progressData: ProgressDisplayData | null;
  totalXP: number;
  xpRank: { rank: number; totalUsers: number; xp: number } | null;
}

/**
 * Hook for managing progress tracking in React components
 */
export function useProgressTracker(skillId?: string, skillTitle?: string) {
  const [state, setState] = useState<UseProgressTrackerState>({
    loading: false,
    error: null,
    progressData: null,
    totalXP: 0,
    xpRank: null
  });

  /**
   * Record a challenge attempt
   */
  const recordChallengeAttempt = useCallback(async (
    challengeId: string,
    success: boolean,
    skillGraph: SkillGraph,
    options: {
      timeSpent?: number;
      hintsUsed?: number;
      submissionCode?: string;
      feedback?: string;
      difficultyLevel?: DifficultyLevel;
    } = {}
  ): Promise<{
    result: ChallengeResult;
    unlockedSkills: string[];
  } | null> => {
    if (!skillId) {
      setState(prev => ({ ...prev, error: 'Skill ID is required' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/skill-progression/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'recordAttempt',
          skillId,
          challengeId,
          success,
          skillGraph,
          ...options
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to record challenge attempt');
      }

      setState(prev => ({ ...prev, loading: false }));

      return {
        result: data.result,
        unlockedSkills: data.unlockedSkills
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [skillId]);

  /**
   * Get progress summary for the current skill
   */
  const getProgressSummary = useCallback(async (): Promise<ProgressSummary | null> => {
    if (!skillId) {
      setState(prev => ({ ...prev, error: 'Skill ID is required' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/skill-progression/progress?action=summary&skillId=${skillId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get progress summary');
      }

      setState(prev => ({ ...prev, loading: false }));
      return data.summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [skillId]);

  /**
   * Get progress display data for the current skill
   */
  const getProgressDisplayData = useCallback(async (): Promise<ProgressDisplayData | null> => {
    if (!skillId || !skillTitle) {
      setState(prev => ({ ...prev, error: 'Skill ID and title are required' }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/skill-progression/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getProgressDisplayData',
          skillId,
          skillTitle
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get progress display data');
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        progressData: data.displayData 
      }));

      return data.displayData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [skillId, skillTitle]);

  /**
   * Get multiple progress data for a skill graph
   */
  const getMultipleProgressData = useCallback(async (
    skillGraph: SkillGraph
  ): Promise<Array<{
    skillId: string;
    title: string;
    progressData: ProgressDisplayData;
  }> | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/skill-progression/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getMultipleProgressData',
          skillGraph
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get multiple progress data');
      }

      setState(prev => ({ ...prev, loading: false }));
      return data.progressData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, []);

  /**
   * Get total XP and rank for the user
   */
  const getTotalXP = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/skill-progression/progress?action=totalXP');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get total XP');
      }

      setState(prev => ({ 
        ...prev, 
        loading: false,
        totalXP: data.totalXP,
        xpRank: data.rank
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  /**
   * Refresh progress data
   */
  const refreshProgress = useCallback(async (): Promise<void> => {
    if (skillId && skillTitle) {
      await getProgressDisplayData();
    }
    await getTotalXP();
  }, [skillId, skillTitle, getProgressDisplayData, getTotalXP]);

  // Auto-load progress data when skillId and skillTitle are provided
  useEffect(() => {
    if (skillId && skillTitle) {
      getProgressDisplayData();
    }
  }, [skillId, skillTitle, getProgressDisplayData]);

  // Auto-load total XP on mount
  useEffect(() => {
    getTotalXP();
  }, [getTotalXP]);

  return {
    // State
    loading: state.loading,
    error: state.error,
    progressData: state.progressData,
    totalXP: state.totalXP,
    xpRank: state.xpRank,

    // Actions
    recordChallengeAttempt,
    getProgressSummary,
    getProgressDisplayData,
    getMultipleProgressData,
    getTotalXP,
    refreshProgress,

    // Utilities
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}

/**
 * Hook for managing multiple skills progress
 */
export function useMultipleSkillsProgress(skillGraph?: SkillGraph) {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    progressData: Array<{
      skillId: string;
      title: string;
      progressData: ProgressDisplayData;
    }>;
  }>({
    loading: false,
    error: null,
    progressData: []
  });

  const loadProgressData = useCallback(async () => {
    if (!skillGraph) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/skill-progression/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getMultipleProgressData',
          skillGraph
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get progress data');
      }

      setState(prev => ({ 
        ...prev, 
        loading: false,
        progressData: data.progressData
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [skillGraph]);

  useEffect(() => {
    if (skillGraph) {
      loadProgressData();
    }
  }, [skillGraph, loadProgressData]);

  return {
    loading: state.loading,
    error: state.error,
    progressData: state.progressData,
    refreshProgress: loadProgressData,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}