
'use client';

import { useState } from 'react';
import SkillCard from './SkillCard';

interface MicroSkill {
  id: string;
  name: string;
  description: string;
  engine: string;
  estimatedMinutes: number;
  prerequisites: string[];
  xpReward: number;
}

interface SkillPath {
  id: string;
  name: string;
  skills: MicroSkill[];
}

interface SkillMastery {
  confidence: number;
  challengesCompleted: number;
  isMastered: boolean;
}

interface LearnerState {
  skillMastery: Record<string, SkillMastery>;
}

interface Props {
  skillPaths: SkillPath[];
  learnerState: LearnerState;
  onStartSkill: (skillId: string) => void;
}

type FilterType = 'all' | 'ready' | 'in_progress' | 'mastered';

export default function MobileFeedView({ skillPaths, learnerState, onStartSkill }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const allSkills = skillPaths.flatMap(path => path.skills);

  const getSkillStatus = (skill: MicroSkill): 'locked' | 'ready' | 'in_progress' | 'mastered' => {
    const mastery = learnerState.skillMastery[skill.id];
    
    if (mastery?.isMastered) return 'mastered';
    
    const prerequisitesMet = !skill.prerequisites || skill.prerequisites.length === 0 || skill.prerequisites.every(
      prereqId => learnerState.skillMastery[prereqId]?.isMastered
    );
    
    if (!prerequisitesMet) return 'locked';
    
    if (mastery && mastery.challengesCompleted > 0) return 'in_progress';
    
    return 'ready';
  };

  const filteredSkills = allSkills.filter(skill => {
    if (filter === 'all') return true;
    return getSkillStatus(skill) === filter;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { value: 'all' as FilterType, label: 'All', icon: '📚' },
          { value: 'ready' as FilterType, label: 'Ready', icon: '●' },
          { value: 'in_progress' as FilterType, label: 'In Progress', icon: '⚡' },
          { value: 'mastered' as FilterType, label: 'Mastered', icon: '✨' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skills Feed */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">🎯</div>
            <p>No skills found in this category</p>
          </div>
        ) : (
          filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              mastery={learnerState.skillMastery[skill.id]}
              status={getSkillStatus(skill)}
              onStart={onStartSkill}
            />
          ))
        )}
      </div>
    </div>
  );
}
