'use client';

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
  description: string;
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

export default function SkillTreeView({ skillPaths, learnerState, onStartSkill }: Props) {
  const getSkillStatus = (skill: MicroSkill): 'locked' | 'ready' | 'in_progress' | 'mastered' => {
    const mastery = learnerState.skillMastery[skill.id];
    
    if (mastery?.isMastered) return 'mastered';
    
    const prerequisitesMet = skill.prerequisites.every(
      prereqId => learnerState.skillMastery[prereqId]?.isMastered
    );
    
    if (!prerequisitesMet) return 'locked';
    
    if (mastery && mastery.challengesCompleted > 0) return 'in_progress';
    
    return 'ready';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Your Skill Tree</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span className="text-gray-400">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span className="text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span>●</span>
            <span className="text-gray-400">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span className="text-gray-400">Locked</span>
          </div>
        </div>
      </div>

      {/* Skill Paths */}
      {skillPaths.map((path, pathIndex) => (
        <div
          key={path.id}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          {/* Path Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                {pathIndex + 1}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{path.name}</h3>
                <p className="text-gray-400 text-sm">{path.description}</p>
              </div>
            </div>
            
            {/* Path Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Path Progress</span>
                <span className="text-white font-semibold">
                  {path.skills.filter(s => learnerState.skillMastery[s.id]?.isMastered).length}/
                  {path.skills.length} skills
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
<div
className="h-full bg-blue-500 rounded-full transition-all"
style={{
  width: `${(path.skills.filter(s => learnerState.skillMastery[s.id]?.isMastered).length / path.skills.length) * 100}%`
}}

/>
</div>
</div>
</div>
      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {path.skills.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            mastery={learnerState.skillMastery[skill.id]}
            status={getSkillStatus(skill)}
            onStart={onStartSkill}
          />
        ))}
      </div>
    </div>
  ))}
</div>
);
}