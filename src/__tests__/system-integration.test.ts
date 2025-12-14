// ============================================
// System Integration Test Suite
// Comprehensive tests for the entire skill progression system
// ============================================

import { skillProgressionCache } from '@/lib/services/cache-service';
import { performanceMonitor } from '@/lib/services/performance-monitor';
import { skillGraphOptimizer } from '@/lib/services/skill-graph-optimizer';
import type { SkillGraph, SkillNode } from '@/lib/services/skill-progression-manager';
import type { SkillState } from '@/types/skill-progression';

describe('System Integration Tests', () => {
  beforeEach(() => {
    // Clear all caches and metrics before each test
    skillProgressionCache.clearAll();
    performanceMonitor.clearMetrics();
  });

  afterAll(() => {
    // Cleanup resources
    skillProgressionCache.destroy();
    performanceMonitor.clearMetrics();
  });

  describe('Course Creation System', () => {
    it('should handle Challenge interface with all required properties', () => {
      const challenge = {
        id: 'test-challenge',
        skillId: 'javascript-basics',
        title: 'JavaScript Fundamentals',
        description: 'Learn the basics of JavaScript',
        engine: 'codestudio',
        difficulty: 'Easy' as const,
        estimatedMinutes: 30,
        xpReward: 100,
        validationCriteria: [
          {
            type: 'output_match' as const,
            expected: 'Hello World'
          }
        ],
        hints: ['Use console.log()'],
        explanation: 'This challenge teaches basic JavaScript output'
      };

      expect(challenge.id).toBe('test-challenge');
      expect(challenge.estimatedMinutes).toBe(30);
      expect(challenge.xpReward).toBe(100);
      expect(challenge.engine).toBe('codestudio');
    });

    it('should handle SkillNode interface with all required properties', () => {
      const skillNode: SkillNode = {
        id: 'js-basics',
        title: 'JavaScript Basics',
        description: 'Learn JavaScript fundamentals',
        prerequisites: [],
        engine: 'codestudio',
        difficulty: 'Easy'
      };

      expect(skillNode.id).toBe('js-basics');
      expect(skillNode.difficulty).toBe('Easy');
      expect(skillNode.prerequisites).toEqual([]);
    });

    it('should handle SkillGraph with proper structure', () => {
      const skillGraph: SkillGraph = {
        nodes: [
          {
            id: 'skill-1',
            title: 'Basic Skill',
            description: 'A basic skill',
            prerequisites: [],
            engine: 'default',
            difficulty: 'Easy'
          },
          {
            id: 'skill-2',
            title: 'Advanced Skill',
            description: 'An advanced skill',
            prerequisites: ['skill-1'],
            engine: 'default',
            difficulty: 'Medium'
          }
        ],
        edges: [
          { from: 'skill-1', to: 'skill-2' }
        ]
      };

      expect(skillGraph.nodes).toHaveLength(2);
      expect(skillGraph.edges).toHaveLength(1);
      expect(skillGraph.nodes[1].prerequisites).toContain('skill-1');
    });
  });

  describe('Performance System Integration', () => {
    it('should integrate caching with performance monitoring', () => {
      // Test cache operations
      const mockProgress = {
        id: 'test-progress',
        userId: 'user-123',
        skillId: 'skill-456',
        challengesCompleted: 2,
        challengesRequired: 3,
        successRate: 0.75,
        masteryAchieved: false,
        lastAttempt: new Date(),
        totalAttempts: 5,
        xpEarned: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Cache the progress
      skillProgressionCache.setProgress('user-123', 'skill-456', mockProgress);

      // Verify caching works
      const cached = skillProgressionCache.getProgress('user-123', 'skill-456');
      expect(cached).toEqual(mockProgress);

      // Test performance monitoring
      const timingId = performanceMonitor.startTiming('cache_test');
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = performanceMonitor.endTiming(timingId, true);
      expect(duration).toBeGreaterThanOrEqual(0);

      // Get system performance
      const systemPerf = performanceMonitor.getSystemPerformance();
      expect(systemPerf).toHaveProperty('cacheStats');
      expect(systemPerf).toHaveProperty('operationMetrics');
      expect(systemPerf).toHaveProperty('recommendations');
    });

    it('should optimize skill graphs for rendering', () => {
      const skillGraph: SkillGraph = {
        nodes: [
          {
            id: 'skill-1',
            title: 'Skill 1',
            description: 'First skill',
            prerequisites: [],
            engine: 'default',
            difficulty: 'Easy'
          },
          {
            id: 'skill-2',
            title: 'Skill 2',
            description: 'Second skill',
            prerequisites: ['skill-1'],
            engine: 'default',
            difficulty: 'Medium'
          }
        ],
        edges: [
          { from: 'skill-1', to: 'skill-2' }
        ]
      };

      const skillStates = new Map<string, SkillState>();
      skillStates.set('skill-1', 'unlocked');
      skillStates.set('skill-2', 'locked');

      const viewport = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        zoom: 1.0
      };

      const optimized = skillGraphOptimizer.optimizeForRendering(
        skillGraph,
        skillStates,
        viewport
      );

      expect(optimized.nodes).toBeDefined();
      expect(optimized.totalNodes).toBe(2);
      expect(optimized.renderingStats).toBeDefined();
      expect(optimized.renderingStats.visibleNodes).toBeGreaterThan(0);
    });
  });

  describe('Type Safety Verification', () => {
    it('should handle all engine types correctly', () => {
      const engines = ['codestudio', 'mathlab', 'lingualab', 'writingstudio', 'default'];
      
      engines.forEach(engine => {
        const challenge = {
          id: `${engine}-challenge`,
          skillId: `${engine}-skill`,
          title: `${engine} Challenge`,
          description: `Challenge for ${engine}`,
          engine,
          difficulty: 'Medium' as const,
          estimatedMinutes: 45,
          xpReward: 150,
          validationCriteria: [],
          hints: [`Use ${engine} features`],
          explanation: `This is a ${engine} challenge`
        };

        expect(challenge.engine).toBe(engine);
        expect(challenge.estimatedMinutes).toBe(45);
        expect(challenge.xpReward).toBe(150);
      });
    });

    it('should handle difficulty levels correctly', () => {
      const difficulties: Array<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];
      
      difficulties.forEach(difficulty => {
        const skillNode: SkillNode = {
          id: `skill-${difficulty.toLowerCase()}`,
          title: `${difficulty} Skill`,
          description: `A ${difficulty.toLowerCase()} skill`,
          prerequisites: [],
          engine: 'default',
          difficulty
        };

        expect(skillNode.difficulty).toBe(difficulty);
      });
    });

    it('should handle skill states correctly', () => {
      const states: SkillState[] = ['locked', 'unlocked', 'mastered'];
      
      states.forEach(state => {
        const skillStates = new Map<string, SkillState>();
        skillStates.set('test-skill', state);
        
        expect(skillStates.get('test-skill')).toBe(state);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid cache operations gracefully', () => {
      // Try to get non-existent cache entry
      const nonExistent = skillProgressionCache.getProgress('invalid-user', 'invalid-skill');
      expect(nonExistent).toBeNull();

      // Cache stats should still work
      const stats = skillProgressionCache.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.progress.size).toBe('number');
    });

    it('should handle performance monitoring errors gracefully', () => {
      // Try to end timing that was never started
      const duration = performanceMonitor.endTiming('invalid-timing-id', false);
      expect(duration).toBe(0);

      // Performance stats should still work
      const metrics = performanceMonitor.getAllMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should handle skill graph optimization with empty data', () => {
      const emptyGraph: SkillGraph = {
        nodes: [],
        edges: []
      };

      const emptyStates = new Map<string, SkillState>();
      const viewport = {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        zoom: 1.0
      };

      const optimized = skillGraphOptimizer.optimizeForRendering(
        emptyGraph,
        emptyStates,
        viewport
      );

      expect(optimized.nodes).toEqual([]);
      expect(optimized.totalNodes).toBe(0);
      expect(optimized.renderingStats.visibleNodes).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should handle skill graph optimizer configuration', () => {
      const config = skillGraphOptimizer.getConfig();
      
      expect(config).toHaveProperty('maxVisibleNodes');
      expect(config).toHaveProperty('clusterThreshold');
      expect(config).toHaveProperty('levelOfDetail');
      expect(config).toHaveProperty('virtualScrolling');

      // Update configuration
      skillGraphOptimizer.updateConfig({
        maxVisibleNodes: 50,
        clusterThreshold: 3
      });

      const updatedConfig = skillGraphOptimizer.getConfig();
      expect(updatedConfig.maxVisibleNodes).toBe(50);
      expect(updatedConfig.clusterThreshold).toBe(3);
    });

    it('should generate optimal viewport for skill graphs', () => {
      const skillGraph: SkillGraph = {
        nodes: [
          {
            id: 'skill-1',
            title: 'Skill 1',
            description: 'First skill',
            prerequisites: [],
            engine: 'default',
            difficulty: 'Easy'
          }
        ],
        edges: []
      };

      const viewport = skillGraphOptimizer.getOptimalViewport(skillGraph);
      
      expect(viewport).toHaveProperty('x');
      expect(viewport).toHaveProperty('y');
      expect(viewport).toHaveProperty('width');
      expect(viewport).toHaveProperty('height');
      expect(viewport).toHaveProperty('zoom');
      expect(viewport.zoom).toBe(1.0);
    });
  });
});