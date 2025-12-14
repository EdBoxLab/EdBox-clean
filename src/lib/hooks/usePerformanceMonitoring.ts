// ============================================
// Performance Monitoring Hook
// React hook for monitoring component performance
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/lib/services/performance-monitor';

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitoring(componentName: string) {
  const timingRef = useRef<string | null>(null);
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    mountTimeRef.current = Date.now();
    const mountTimingId = performanceMonitor.startTiming(`${componentName}_mount`);
    
    return () => {
      // Component unmount
      if (mountTimingId) {
        performanceMonitor.endTiming(mountTimingId, true);
      }
    };
  }, [componentName]);

  // Track render count
  useEffect(() => {
    renderCountRef.current++;
  });

  /**
   * Start timing an operation
   */
  const startTiming = useCallback((operationName: string): string => {
    const timingId = performanceMonitor.startTiming(`${componentName}_${operationName}`);
    timingRef.current = timingId;
    return timingId;
  }, [componentName]);

  /**
   * End timing an operation
   */
  const endTiming = useCallback((timingId?: string, success: boolean = true): number => {
    const id = timingId || timingRef.current;
    if (id) {
      const duration = performanceMonitor.endTiming(id, success);
      timingRef.current = null;
      return duration;
    }
    return 0;
  }, []);

  /**
   * Time an async operation
   */
  const timeAsync = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const timingId = startTiming(operationName);
    try {
      const result = await operation();
      endTiming(timingId, true);
      return result;
    } catch (error) {
      endTiming(timingId, false);
      throw error;
    }
  }, [startTiming, endTiming]);

  /**
   * Time a synchronous operation
   */
  const timeSync = useCallback(<T>(
    operationName: string,
    operation: () => T
  ): T => {
    const timingId = startTiming(operationName);
    try {
      const result = operation();
      endTiming(timingId, true);
      return result;
    } catch (error) {
      endTiming(timingId, false);
      throw error;
    }
  }, [startTiming, endTiming]);

  /**
   * Get component performance stats
   */
  const getStats = useCallback(() => {
    const uptime = Date.now() - mountTimeRef.current;
    return {
      componentName,
      renderCount: renderCountRef.current,
      uptime,
      averageRenderTime: uptime / renderCountRef.current
    };
  }, [componentName]);

  return {
    startTiming,
    endTiming,
    timeAsync,
    timeSync,
    getStats,
    renderCount: renderCountRef.current
  };
}

/**
 * Hook for monitoring API call performance
 */
export function useAPIPerformanceMonitoring() {
  const timeAPICall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const timingId = performanceMonitor.startTiming(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
    
    try {
      const result = await apiCall();
      performanceMonitor.endTiming(timingId, true);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(timingId, false);
      throw error;
    }
  }, []);

  return { timeAPICall };
}

/**
 * Hook for monitoring skill progression operations
 */
export function useSkillProgressionPerformance() {
  const { timeAsync } = usePerformanceMonitoring('skill-progression');

  const timeProgressUpdate = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    return timeAsync('progress_update', operation);
  }, [timeAsync]);

  const timeChallengeGeneration = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    return timeAsync('challenge_generation', operation);
  }, [timeAsync]);

  const timeSkillStateCalculation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    return timeAsync('skill_state_calculation', operation);
  }, [timeAsync]);

  return {
    timeProgressUpdate,
    timeChallengeGeneration,
    timeSkillStateCalculation
  };
}