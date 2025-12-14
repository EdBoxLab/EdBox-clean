// ============================================
// Background Challenge Generator
// Pre-generates challenges in the background to improve response times
// ============================================

import { challengeGenerator } from './challenge-generator';
import { skillProgressionCache } from './cache-service';
import { skillProgressionDb } from './skill-progression-db';
import type { 
  ChallengeGenerationRequest, 
  GeneratedChallenge, 
  DifficultyLevel,
  SkillConfiguration 
} from '@/types/skill-progression';

/**
 * Background generation job
 */
interface GenerationJob {
  id: string;
  skillId: string;
  userId?: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: DifficultyLevel;
  challengeType?: string;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

/**
 * Generation queue statistics
 */
interface QueueStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageGenerationTime: number;
  queueProcessingRate: number;
}

/**
 * Background challenge generation service
 */
export class BackgroundChallengeGenerator {
  private queue: GenerationJob[] = [];
  private processing = false;
  private processingInterval?: NodeJS.Timeout;
  private stats: QueueStats = {
    totalJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageGenerationTime: 0,
    queueProcessingRate: 0,
  };

  private config = {
    maxConcurrentJobs: 3,
    processingInterval: 5000, // 5 seconds
    maxRetries: 3,
    priorityWeights: {
      high: 3,
      medium: 2,
      low: 1,
    },
  };

  constructor() {
    this.startProcessing();
  }

  /**
   * Queue a challenge generation job
   */
  queueGeneration(
    skillId: string,
    options: {
      userId?: string;
      priority?: 'high' | 'medium' | 'low';
      difficulty?: DifficultyLevel;
      challengeType?: string;
    } = {}
  ): string {
    const jobId = `${skillId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: GenerationJob = {
      id: jobId,
      skillId,
      userId: options.userId,
      priority: options.priority || 'medium',
      difficulty: options.difficulty || 'Medium',
      challengeType: options.challengeType,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: this.config.maxRetries,
    };

    // Insert job in priority order
    this.insertJobByPriority(job);
    this.stats.totalJobs++;
    this.stats.pendingJobs++;

    return jobId;
  }

  /**
   * Pre-generate challenges for popular skills
   */
  async preGeneratePopularSkills(): Promise<void> {
    try {
      // Get popular skills based on recent activity
      const popularSkills = await this.getPopularSkills();
      
      for (const skillId of popularSkills) {
        // Check if we already have enough challenges cached
        const cachedPool = skillProgressionCache.getChallengePool(skillId);
        const poolSize = cachedPool?.length || 0;
        
        if (poolSize < 3) { // Ensure minimum pool size
          // Queue generation for different difficulties
          this.queueGeneration(skillId, { priority: 'low', difficulty: 'Easy' });
          this.queueGeneration(skillId, { priority: 'low', difficulty: 'Medium' });
          this.queueGeneration(skillId, { priority: 'low', difficulty: 'Hard' });
        }
      }
    } catch (error) {
      console.error('Failed to pre-generate popular skills:', error);
    }
  }

  /**
   * Pre-generate challenges for user's unlocked skills
   */
  async preGenerateForUser(userId: string, unlockedSkills: string[]): Promise<void> {
    for (const skillId of unlockedSkills) {
      // Check current pool size
      const cachedPool = skillProgressionCache.getChallengePool(skillId);
      const poolSize = cachedPool?.length || 0;
      
      if (poolSize < 2) { // Ensure user has challenges ready
        this.queueGeneration(skillId, { 
          userId, 
          priority: 'high', 
          difficulty: 'Medium' // Start with medium difficulty
        });
      }
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return { ...this.stats };
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    jobs: Array<{
      id: string;
      skillId: string;
      priority: string;
      attempts: number;
      age: number;
    }>;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      jobs: this.queue.map(job => ({
        id: job.id,
        skillId: job.skillId,
        priority: job.priority,
        attempts: job.attempts,
        age: Date.now() - job.createdAt.getTime(),
      })),
    };
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processQueue();
      }
    }, this.config.processingInterval);
  }

  /**
   * Stop background processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * Process the generation queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      // Process up to maxConcurrentJobs
      const jobsToProcess = this.queue.splice(0, this.config.maxConcurrentJobs);
      
      const promises = jobsToProcess.map(job => this.processJob(job));
      await Promise.allSettled(promises);

      // Update processing rate
      const processingTime = Date.now() - startTime;
      this.stats.queueProcessingRate = jobsToProcess.length / (processingTime / 1000);

    } catch (error) {
      console.error('Error processing challenge generation queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single generation job
   */
  private async processJob(job: GenerationJob): Promise<void> {
    const startTime = Date.now();
    
    try {
      job.attempts++;

      // Create generation request
      const request: ChallengeGenerationRequest = {
        skillId: job.skillId,
        difficultyLevel: job.difficulty,
        challengeType: job.challengeType,
        userId: job.userId,
      };

      // Generate challenge
      const challenge = await challengeGenerator.generateChallenge(request);

      // Cache the generated challenge
      skillProgressionCache.setChallenge(job.skillId, challenge);

      // Update pool cache
      const existingPool = skillProgressionCache.getChallengePool(job.skillId) || [];
      const updatedPool = [...existingPool, challenge];
      skillProgressionCache.setChallengePool(job.skillId, updatedPool);

      // Update statistics
      this.stats.completedJobs++;
      this.stats.pendingJobs--;
      
      const generationTime = Date.now() - startTime;
      this.updateAverageGenerationTime(generationTime);

      console.log(`Background challenge generated for skill ${job.skillId} in ${generationTime}ms`);

    } catch (error) {
      console.error(`Failed to generate challenge for job ${job.id}:`, error);

      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        // Re-queue with lower priority
        job.priority = 'low';
        this.insertJobByPriority(job);
      } else {
        // Mark as failed
        this.stats.failedJobs++;
        this.stats.pendingJobs--;
      }
    }
  }

  /**
   * Insert job in queue based on priority
   */
  private insertJobByPriority(job: GenerationJob): void {
    const jobWeight = this.config.priorityWeights[job.priority];
    
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const existingWeight = this.config.priorityWeights[this.queue[i].priority];
      if (jobWeight > existingWeight) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, job);
  }

  /**
   * Get popular skills based on recent activity
   */
  private async getPopularSkills(): Promise<string[]> {
    try {
      // This would ideally query recent challenge attempts or user activity
      // For now, return a default set of popular skills
      return [
        'javascript-basics',
        'python-fundamentals',
        'html-css-basics',
        'react-components',
        'database-queries',
      ];
    } catch (error) {
      console.error('Failed to get popular skills:', error);
      return [];
    }
  }

  /**
   * Update average generation time
   */
  private updateAverageGenerationTime(newTime: number): void {
    const totalCompleted = this.stats.completedJobs;
    if (totalCompleted === 1) {
      this.stats.averageGenerationTime = newTime;
    } else {
      // Running average
      this.stats.averageGenerationTime = 
        (this.stats.averageGenerationTime * (totalCompleted - 1) + newTime) / totalCompleted;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopProcessing();
    this.queue = [];
  }
}

// Export singleton instance
export const backgroundChallengeGenerator = new BackgroundChallengeGenerator();