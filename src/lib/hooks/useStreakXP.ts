'use client';

import { useState, useEffect, useCallback } from 'react';

interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  streakStartedAt: string | null;
}

interface XPData {
  total: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
}

interface XPBreakdown {
  type: string;
  amount: number;
}

interface StreakXPState {
  streak: StreakData;
  xp: XPData;
  loading: boolean;
  error: string | null;
  lastCheckIn: string | null;
  showCelebration: boolean;
  celebrationData: {
    xpGained: number;
    breakdown: XPBreakdown[];
    leveledUp: boolean;
    newLevel: number;
    streakMilestone: boolean;
  } | null;
}

export function useStreakXP() {
  const [state, setState] = useState<StreakXPState>({
    streak: { current: 0, longest: 0, lastActivityDate: null, streakStartedAt: null },
    xp: { total: 0, level: 1, xpForCurrentLevel: 0, xpForNextLevel: 100, progress: 0 },
    loading: true,
    error: null,
    lastCheckIn: null,
    showCelebration: false,
    celebrationData: null,
  });

  const fetchStreakXP = useCallback(async () => {
    try {
      const response = await fetch('/api/streaks');
      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }
        throw new Error('Failed to fetch streak data');
      }
      const data = await response.json();
      setState(prev => ({
        ...prev,
        streak: data.streak,
        xp: data.xp,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  const checkIn = useCallback(async () => {
    try {
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily_login' }),
      });

      if (!response.ok) throw new Error('Failed to check in');

      const data = await response.json();

      if (data.alreadyCheckedIn) {
        setState(prev => ({ ...prev, lastCheckIn: new Date().toISOString().split('T')[0] }));
        return { alreadyCheckedIn: true };
      }

      const hasStreakMilestone = data.xp.breakdown?.some(
        (b: XPBreakdown) => b.type.includes('Milestone')
      );

      setState(prev => ({
        ...prev,
        streak: data.streak,
        xp: {
          ...prev.xp,
          total: data.xp.total,
          level: data.xp.level,
        },
        lastCheckIn: new Date().toISOString().split('T')[0],
        showCelebration: data.xp.gained > 0,
        celebrationData: {
          xpGained: data.xp.gained,
          breakdown: data.xp.breakdown || [],
          leveledUp: data.xp.leveledUp,
          newLevel: data.xp.level,
          streakMilestone: hasStreakMilestone,
        },
      }));

      return data;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      return null;
    }
  }, []);

  const addXP = useCallback(async (action: 'lesson_complete' | 'quiz_complete' | 'course_complete') => {
    try {
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error('Failed to add XP');

      const data = await response.json();

      setState(prev => ({
        ...prev,
        xp: {
          ...prev.xp,
          total: data.xp.total,
          level: data.xp.level,
        },
        showCelebration: data.xp.leveledUp,
        celebrationData: data.xp.leveledUp ? {
          xpGained: data.xp.gained,
          breakdown: data.xp.breakdown || [],
          leveledUp: true,
          newLevel: data.xp.level,
          streakMilestone: false,
        } : null,
      }));

      return data;
    } catch (err) {
      return null;
    }
  }, []);

  const dismissCelebration = useCallback(() => {
    setState(prev => ({ ...prev, showCelebration: false, celebrationData: null }));
  }, []);

  useEffect(() => {
    fetchStreakXP();
  }, [fetchStreakXP]);

  return {
    ...state,
    fetchStreakXP,
    checkIn,
    addXP,
    dismissCelebration,
  };
}
