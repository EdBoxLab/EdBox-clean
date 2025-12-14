import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillGraphRenderer from '../SkillGraphRenderer';
import type { SkillGraph } from '@/lib/courseCreation/types';

// Mock the hooks and services
jest.mock('@/lib/hooks/useProgressTracker', () => ({
  useMultipleSkillsProgress: () => ({
    progressData: [],
    loading: false,
    error: null
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => <div>Mocked Engine</div>;
  return DynamicComponent;
});

describe('SkillGraphRenderer', () => {
  const mockGraph: SkillGraph = {
    goal: 'Test Learning Path',
    nodes: [
      {
        id: 'skill-1',
        title: 'Basic Skill',
        description: 'A basic skill for testing',
        category: 'Technology' as any,
        prerequisites: [],
        engine: 'codestudio',
        level: 'Beginner',
        estimatedMinutes: 30,
        masteryThreshold: {
          minSuccessRate: 0.8,
          challengesRequired: 3
        },
        xpReward: 100
      },
      {
        id: 'skill-2',
        title: 'Advanced Skill',
        description: 'An advanced skill for testing',
        category: 'Technology' as any,
        prerequisites: ['skill-1'],
        engine: 'mathlab',
        level: 'Advanced',
        estimatedMinutes: 45,
        masteryThreshold: {
          minSuccessRate: 0.8,
          challengesRequired: 3
        },
        xpReward: 200
      }
    ],
    edges: [
      { from: 'skill-1', to: 'skill-2' }
    ]
  };

  it('renders the skill graph with correct title', () => {
    render(<SkillGraphRenderer graph={mockGraph} />);
    
    expect(screen.getByText('Test Learning Path')).toBeInTheDocument();
  });

  it('displays skill nodes with correct information', () => {
    render(<SkillGraphRenderer graph={mockGraph} />);
    
    expect(screen.getByText('Basic Skill')).toBeInTheDocument();
    expect(screen.getByText('Advanced Skill')).toBeInTheDocument();
    expect(screen.getByText('A basic skill for testing')).toBeInTheDocument();
  });

  it('shows progress indicators', () => {
    render(<SkillGraphRenderer graph={mockGraph} />);
    
    // Check for progress-related text
    expect(screen.getByText(/mastered/i)).toBeInTheDocument();
    expect(screen.getByText(/unlocked/i)).toBeInTheDocument();
  });

  it('displays learning path section', () => {
    render(<SkillGraphRenderer graph={mockGraph} />);
    
    expect(screen.getByText('Your Learning Path')).toBeInTheDocument();
  });

  it('shows how it works section', () => {
    render(<SkillGraphRenderer graph={mockGraph} />);
    
    expect(screen.getByText('Click a Skill')).toBeInTheDocument();
    expect(screen.getByText('Practice in Engine')).toBeInTheDocument();
    expect(screen.getByText('Master & Progress')).toBeInTheDocument();
  });
});