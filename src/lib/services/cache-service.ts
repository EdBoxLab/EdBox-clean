// ============================================
// Cache Service
// Provides in-memory caching with TTL and LRU eviction
// ============================================

import type { 
  UserSkillProgress, 
  GeneratedChallenge, 
  SkillConfiguration,
  DifficultyAdjustment 
} from '@/types/skill-progression';

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache configuration options
 */
interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

/**
 * High-performance in-memory cache with TTL and LRU eviction
 */
export class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      cleanupInterval: config.cleanupInterval || 60 * 1000, // 1 minute
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;

    // If cache is full, evict LRU entry
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    const size = this.cache.size;
    const maxSize = this.config.maxSize;
    
    // Calculate approximate memory usage
    const memoryUsage = size * 1024; // Rough estimate in bytes

    // Calculate hit rate (simplified)
    let totalAccesses = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
    }
    
    const hitRate = totalAccesses > 0 ? (size / totalAccesses) : 0;

    return {
      size,
      maxSize,
      hitRate,
      memoryUsage,
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Stop cleanup timer (for cleanup)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

/**
 * Specialized cache instances for different data types
 */
export class SkillProgressionCache {
  private progressCache = new CacheService<UserSkillProgress>({
    maxSize: 500,
    defaultTTL: 2 * 60 * 1000, // 2 minutes for progress data
  });

  private challengeCache = new CacheService<GeneratedChallenge>({
    maxSize: 200,
    defaultTTL: 10 * 60 * 1000, // 10 minutes for challenges
  });

  private configCache = new CacheService<SkillConfiguration>({
    maxSize: 100,
    defaultTTL: 30 * 60 * 1000, // 30 minutes for configurations
  });

  private difficultyCache = new CacheService<DifficultyAdjustment>({
    maxSize: 300,
    defaultTTL: 5 * 60 * 1000, // 5 minutes for difficulty adjustments
  });

  private skillStatesCache = new CacheService<Map<string, 'locked' | 'unlocked' | 'mastered'>>({
    maxSize: 100,
    defaultTTL: 3 * 60 * 1000, // 3 minutes for skill states
  });

  /**
   * Progress data caching
   */
  getProgress(userId: string, skillId: string): UserSkillProgress | null {
    return this.progressCache.get(`${userId}:${skillId}`);
  }

  setProgress(userId: string, skillId: string, progress: UserSkillProgress): void {
    this.progressCache.set(`${userId}:${skillId}`, progress);
  }

  invalidateProgress(userId: string, skillId?: string): void {
    if (skillId) {
      this.progressCache.delete(`${userId}:${skillId}`);
    } else {
      // Invalidate all progress for user
      const keysToDelete: string[] = [];
      for (const key of Object.keys(this.progressCache)) {
        if (key.startsWith(`${userId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.progressCache.delete(key));
    }
  }

  /**
   * Challenge caching
   */
  getChallenge(skillId: string, challengeId: string): GeneratedChallenge | null {
    return this.challengeCache.get(`${skillId}:${challengeId}`);
  }

  setChallenge(skillId: string, challenge: GeneratedChallenge): void {
    this.challengeCache.set(`${skillId}:${challenge.id}`, challenge);
  }

  getChallengePool(skillId: string): GeneratedChallenge[] | null {
    return this.challengeCache.get(`pool:${skillId}`) as GeneratedChallenge[] | null;
  }

  setChallengePool(skillId: string, challenges: GeneratedChallenge[]): void {
    this.challengeCache.set(`pool:${skillId}`, challenges as any);
  }

  /**
   * Configuration caching
   */
  getConfiguration(skillId: string): SkillConfiguration | null {
    return this.configCache.get(skillId);
  }

  setConfiguration(config: SkillConfiguration): void {
    this.configCache.set(config.skillId, config);
  }

  invalidateConfiguration(skillId?: string): void {
    if (skillId) {
      this.configCache.delete(skillId);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * Difficulty adjustment caching
   */
  getDifficultyAdjustment(userId: string, skillId: string): DifficultyAdjustment | null {
    return this.difficultyCache.get(`${userId}:${skillId}`);
  }

  setDifficultyAdjustment(userId: string, skillId: string, adjustment: DifficultyAdjustment): void {
    this.difficultyCache.set(`${userId}:${skillId}`, adjustment);
  }

  /**
   * Skill states caching
   */
  getSkillStates(userId: string, graphId: string): Map<string, 'locked' | 'unlocked' | 'mastered'> | null {
    return this.skillStatesCache.get(`${userId}:${graphId}`);
  }

  setSkillStates(userId: string, graphId: string, states: Map<string, 'locked' | 'unlocked' | 'mastered'>): void {
    this.skillStatesCache.set(`${userId}:${graphId}`, states);
  }

  invalidateSkillStates(userId: string, graphId?: string): void {
    if (graphId) {
      this.skillStatesCache.delete(`${userId}:${graphId}`);
    } else {
      // Invalidate all skill states for user
      const keysToDelete: string[] = [];
      for (const key of Object.keys(this.skillStatesCache)) {
        if (key.startsWith(`${userId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.skillStatesCache.delete(key));
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    return {
      progress: this.progressCache.getStats(),
      challenges: this.challengeCache.getStats(),
      configurations: this.configCache.getStats(),
      difficulty: this.difficultyCache.getStats(),
      skillStates: this.skillStatesCache.getStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.progressCache.clear();
    this.challengeCache.clear();
    this.configCache.clear();
    this.difficultyCache.clear();
    this.skillStatesCache.clear();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.progressCache.destroy();
    this.challengeCache.destroy();
    this.configCache.destroy();
    this.difficultyCache.destroy();
    this.skillStatesCache.destroy();
  }
}

// Export singleton instance
export const skillProgressionCache = new SkillProgressionCache();