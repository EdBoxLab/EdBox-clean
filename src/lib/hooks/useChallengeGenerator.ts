import { useState, useCallback } from 'react';
import type { GeneratedChallenge, DifficultyLevel } from '@/types/skill-progression';

interface ChallengeGeneratorState {
  challenges: GeneratedChallenge[];
  loading: boolean;
  error: string | null;
}

interface GenerateChallengeOptions {
  skillId: string;
  difficultyLevel: DifficultyLevel;
  challengeType?: string;
}

interface GenerateVariedOptions {
  skillId: string;
  count: number;
  difficultyLevel: DifficultyLevel;
}

export function useChallengeGenerator() {
  const [state, setState] = useState<ChallengeGeneratorState>({
    challenges: [],
    loading: false,
    error: null
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setChallenges = useCallback((challengesOrUpdater: GeneratedChallenge[] | ((prev: GeneratedChallenge[]) => GeneratedChallenge[])) => {
    setState(prev => ({ 
      ...prev, 
      challenges: typeof challengesOrUpdater === 'function' 
        ? challengesOrUpdater(prev.challenges) 
        : challengesOrUpdater 
    }));
  }, []);

  const generateChallenge = useCallback(async (options: GenerateChallengeOptions): Promise<GeneratedChallenge | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/skill-progression/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          ...options
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate challenge');
      }

      if (data.success && data.challenge) {
        // Add to current challenges
        setChallenges((prev: GeneratedChallenge[]) => [...prev, data.challenge]);
        return data.challenge;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setChallenges]);

  const generateVariedChallenges = useCallback(async (options: GenerateVariedOptions): Promise<GeneratedChallenge[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/skill-progression/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateVaried',
          ...options
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate varied challenges');
      }

      if (data.success && data.challenges) {
        setChallenges(data.challenges);
        return data.challenges;
      }

      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setChallenges]);

  const getChallengePool = useCallback(async (skillId: string): Promise<GeneratedChallenge[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/skill-progression/challenge?skillId=${encodeURIComponent(skillId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get challenge pool');
      }

      if (data.success && data.challenges) {
        setChallenges(data.challenges);
        return data.challenges;
      }

      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setChallenges]);

  const ensurePoolSize = useCallback(async (skillId: string, targetSize: number = 3): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/skill-progression/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ensurePool',
          skillId,
          targetSize
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ensure pool size');
      }

      if (data.success && data.challenges) {
        setChallenges(data.challenges);
        return true;
      }

      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setChallenges]);

  const clearChallenges = useCallback(() => {
    setChallenges([]);
    setError(null);
  }, [setChallenges, setError]);

  return {
    // State
    challenges: state.challenges,
    loading: state.loading,
    error: state.error,

    // Actions
    generateChallenge,
    generateVariedChallenges,
    getChallengePool,
    ensurePoolSize,
    clearChallenges,
  };
}