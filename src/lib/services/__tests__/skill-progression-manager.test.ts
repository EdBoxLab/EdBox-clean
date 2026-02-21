import { SkillProgressionManager, SkillGraph, SkillNode } from '../skill-progression-manager';
import { SkillState, DifficultyLevel } from '@/types/skill-progression';

// Mock the database service
jest.mock('../skill-progression-db', () => ({
  skillProgressionDb: {
    getSkillProgress: jest.fn(),
    getMasteredSkills: jest.fn(),
    getCompletedSkills: jest.fn(),
    getSkillConfiguration: jest.fn(),
  }
}));

// Mock the cache service
jest.mock('../cache-service', () => ({
  skillProgressionCache: {
    getSkillStates: jest.fn().mockReturnValue(null),
    setSkillStates: jest.fn(),
  }
}));

const { skillProgressionDb } = require('../skill-progression-db');

describe('SkillProgressionManager', () => {
  let manager: SkillProgressionManager;

  const makeGraph = (nodes: SkillNode[]): SkillGraph => ({
    nodes,
    edges: [],
  });

  const makeNode = (id: string, prerequisites: string[] = []): SkillNode => ({
    id,
    title: id,
    description: `Skill ${id}`,
    prerequisites,
    engine: 'default',
    difficulty: 'Medium' as DifficultyLevel,
  });

  beforeEach(() => {
    manager = new SkillProgressionManager();
    jest.clearAllMocks();
  });

  describe('getSkillUnlockStatus', () => {
    it('should unlock skills with no prerequisites', async () => {
      const graph = makeGraph([makeNode('skill-1')]);
      skillProgressionDb.getCompletedSkills.mockResolvedValue([]);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-1', graph);

      expect(status.canUnlock).toBe(true);
      expect(status.state).toBe('unlocked');
      expect(status.unmetPrerequisites).toHaveLength(0);
    });

    it('should unlock skill when prerequisites have ≥1 completed challenge', async () => {
      const graph = makeGraph([
        makeNode('prereq-1'),
        makeNode('skill-2', ['prereq-1']),
      ]);
      // prereq-1 has been completed (at least 1 challenge)
      skillProgressionDb.getCompletedSkills.mockResolvedValue(['prereq-1']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-2', graph);

      expect(status.canUnlock).toBe(true);
      expect(status.state).toBe('unlocked');
    });

    it('should keep skill locked when prerequisites have 0 completed challenges', async () => {
      const graph = makeGraph([
        makeNode('prereq-1'),
        makeNode('skill-2', ['prereq-1']),
      ]);
      // prereq-1 has NOT been completed
      skillProgressionDb.getCompletedSkills.mockResolvedValue([]);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-2', graph);

      expect(status.canUnlock).toBe(false);
      expect(status.state).toBe('locked');
      expect(status.unmetPrerequisites).toEqual(['prereq-1']);
    });

    it('should show mastered state for mastered skills', async () => {
      const graph = makeGraph([makeNode('skill-1')]);
      skillProgressionDb.getCompletedSkills.mockResolvedValue(['skill-1']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue(['skill-1']);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-1', graph);

      expect(status.canUnlock).toBe(true);
      expect(status.state).toBe('mastered');
    });

    it('should handle multi-prerequisite skills correctly', async () => {
      const graph = makeGraph([
        makeNode('prereq-1'),
        makeNode('prereq-2'),
        makeNode('skill-3', ['prereq-1', 'prereq-2']),
      ]);
      // Only prereq-1 completed, prereq-2 not yet
      skillProgressionDb.getCompletedSkills.mockResolvedValue(['prereq-1']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-3', graph);

      expect(status.canUnlock).toBe(false);
      expect(status.state).toBe('locked');
      expect(status.unmetPrerequisites).toEqual(['prereq-2']);
    });

    it('should unlock multi-prerequisite skill when all prerequisites completed', async () => {
      const graph = makeGraph([
        makeNode('prereq-1'),
        makeNode('prereq-2'),
        makeNode('skill-3', ['prereq-1', 'prereq-2']),
      ]);
      skillProgressionDb.getCompletedSkills.mockResolvedValue(['prereq-1', 'prereq-2']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const status = await manager.getSkillUnlockStatus('user-1', 'skill-3', graph);

      expect(status.canUnlock).toBe(true);
      expect(status.state).toBe('unlocked');
    });
  });

  describe('getAllSkillStates', () => {
    it('should return correct states for a mixed skill graph', async () => {
      const graph = makeGraph([
        makeNode('root-1'),
        makeNode('root-2'),
        makeNode('mid-1', ['root-1']),
        makeNode('advanced-1', ['root-1', 'root-2']),
      ]);

      // root-1 completed, root-2 not started
      skillProgressionDb.getCompletedSkills.mockResolvedValue(['root-1']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue([]);

      const states = await manager.getAllSkillStates('user-1', graph);

      // Root skills (no prereqs) always unlocked
      expect(states.get('root-1')).toBe('unlocked');
      expect(states.get('root-2')).toBe('unlocked');
      // mid-1 depends on root-1 (completed) → unlocked
      expect(states.get('mid-1')).toBe('unlocked');
      // advanced-1 depends on both root-1 (completed) and root-2 (not completed) → locked
      expect(states.get('advanced-1')).toBe('locked');
    });

    it('should mark mastered skills as mastered', async () => {
      const graph = makeGraph([
        makeNode('skill-1'),
        makeNode('skill-2', ['skill-1']),
      ]);

      skillProgressionDb.getCompletedSkills.mockResolvedValue(['skill-1']);
      skillProgressionDb.getMasteredSkills.mockResolvedValue(['skill-1']);

      const states = await manager.getAllSkillStates('user-1', graph);

      expect(states.get('skill-1')).toBe('mastered');
      expect(states.get('skill-2')).toBe('unlocked');
    });
  });
});