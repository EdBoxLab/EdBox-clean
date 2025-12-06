'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressHeader from './ProgressHeader';
import SkillTreeView from './SkillTreeView';
import MobileFeedView from './MobileFeedView';
import MiniProjectCard from './MiniProjectCard';

interface MicroSkill {
  id: string;
  name: string;
  description: string;
  engine: string;
  estimatedMinutes: number;
  prerequisites: string[];
  masteryThreshold: {
    minChallenges: number;
    minConfidence: number;
    minSuccessRate: number;
  };
  challengeTypes: string[];
  xpReward: number;
}

interface SkillPath {
  id: string;
  name: string;
  description: string;
  skills: MicroSkill[];
}

interface MiniProject {
  id: string;
  name: string;
  description: string;
  unlocksAfter: string[];
  engine: string;
  estimatedMinutes: number;
  xpReward: number;
  shareTemplate: string;
}

interface SkillGraph {
  id: string;
  userId: string;
  goal: string;
  context: string;
  totalSkills: number;
  estimatedHours: string;
  skillPaths: SkillPath[];
  miniProjects: MiniProject[];
  capstoneProject: MiniProject;
  createdAt: string;
}

interface SkillMastery {
  confidence: number;
  challengesCompleted: number;
  successRate: number;
  timeSpent: number;
  lastPracticed: string | null;
  isMastered: boolean;
}

interface LearnerState {
  id: string;
  userId: string;
  skillGraphId: string;
  skillMastery: Record<string, SkillMastery>;
  currentSkill: string | null;
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  startedAt: string;
  lastActive: string;
}

interface Props {
  skillGraph: SkillGraph;
  learnerState: LearnerState;
  userId: string;
}

export default function LearningPathView({ skillGraph, learnerState, userId }: Props) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<'tree' | 'feed'>('tree');

  // Detect mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setView(window.innerWidth < 768 ? 'feed' : 'tree');
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate stats
  const allSkills = skillGraph.skillPaths.flatMap(path => path.skills);
  const masteredSkills = allSkills.filter(
    skill => learnerState.skillMastery[skill.id]?.isMastered
  );
  const readySkills = allSkills.filter(skill => 
    skill.prerequisites.every(prereqId => 
      learnerState.skillMastery[prereqId]?.isMastered
    ) && !learnerState.skillMastery[skill.id]?.isMastered
  );

  // Get next skill to work on
  const getNextSkill = (): MicroSkill | null => {
    // If already working on a skill, return it
    if (learnerState.currentSkill) {
      const current = allSkills.find(s => s.id === learnerState.currentSkill);
      if (current && !learnerState.skillMastery[current.id]?.isMastered) {
        return current;
      }
    }

    // Find skills in progress (started but not mastered)
    const inProgress = readySkills.filter(
      skill => learnerState.skillMastery[skill.id]?.challengesCompleted > 0
    );
    if (inProgress.length > 0) {
      return inProgress[0];
    }

    // Return first ready skill
    return readySkills[0] || null;
  };

  const nextSkill = getNextSkill();

  // Check if any projects are unlocked
  const unlockedProjects = skillGraph.miniProjects.filter(project =>
    project.unlocksAfter.every(skillId => 
      learnerState.skillMastery[skillId]?.isMastered
    )
  );

  const capstoneUnlocked = skillGraph.capstoneProject.unlocksAfter.every(
    skillId => learnerState.skillMastery[skillId]?.isMastered
  );

  const handleStartSkill = async (skillId: string) => {
    try {
      // Update current skill in backend
      const response = await fetch('/api/learner/state', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          skillGraphId: skillGraph.id,
          currentSkill: skillId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update learner state');
      }

      // Navigate to the skill challenge
      router.push(`/skill/${skillId}`);
    } catch (error) {
      console.error('Error starting skill:', error);
      alert('Failed to start skill. Please try again.');
    }
  };

  const handleStartProject = async (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* Header */}
      <ProgressHeader
        goal={skillGraph.goal}
        totalSkills={skillGraph.totalSkills}
        masteredSkills={masteredSkills.length}
        totalXP={learnerState.totalXP}
        level={learnerState.level}
        streak={learnerState.streak}
        estimatedHours={skillGraph.estimatedHours}
      />

      {/* View Toggle (Desktop only) */}
      {!isMobile && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setView('tree')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                view === 'tree'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🗺️ Skill Tree
            </button>
            <button
              onClick={() => setView('feed')}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                view === 'feed'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📱 Feed View
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Next Skill CTA */}
        {nextSkill && (
          <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-semibold mb-1">
                  NEXT UP
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {nextSkill.name}
                </h2>
                <p className="text-blue-100 mb-3">{nextSkill.description}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white">
                    ⏱️ {nextSkill.estimatedMinutes} min
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white">
                    🎯 +{nextSkill.xpReward} XP
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-white">
                    💻 {nextSkill.engine}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleStartSkill(nextSkill.id)}
                className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold text-lg rounded-xl transition-colors shadow-lg whitespace-nowrap"
              >
                Start Now 🚀
              </button>
            </div>
          </div>
        )}

        {/* Unlocked Projects */}
        {unlockedProjects.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🎉 Projects Unlocked!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedProjects.map(project => (
                <MiniProjectCard
                  key={project.id}
                  project={project}
                  onStart={handleStartProject}
                />
              ))}
            </div>
          </div>
        )}

        {/* Capstone Project */}
        {capstoneUnlocked && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">👑</span>
                <div>
                  <p className="text-yellow-100 text-sm font-semibold">
                    CAPSTONE PROJECT
                  </p>
                  <h3 className="text-2xl font-bold text-white">
                    {skillGraph.capstoneProject.name}
                  </h3>
                </div>
              </div>
              <p className="text-yellow-100 mb-4">
                {skillGraph.capstoneProject.description}
              </p>
              <button
                onClick={() => handleStartProject(skillGraph.capstoneProject.id)}
                className="px-8 py-4 bg-white hover:bg-gray-100 text-orange-600 font-bold text-lg rounded-xl transition-colors shadow-lg"
              >
                Start Capstone 🎓
              </button>
            </div>
          </div>
        )}

        {/* Skill View */}
        {view === 'tree' ? (
          <SkillTreeView
            skillPaths={skillGraph.skillPaths}
            learnerState={learnerState}
            onStartSkill={handleStartSkill}
          />
        ) : (
          <MobileFeedView
            skillPaths={skillGraph.skillPaths}
            learnerState={learnerState}
            onStartSkill={handleStartSkill}
          />
        )}

        {/* Completion Message */}
        {masteredSkills.length === allSkills.length && capstoneUnlocked && (
          <div className="mt-8 text-center p-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Congratulations!
            </h2>
            <p className="text-white/90 text-lg">
              You've mastered all skills. Complete the capstone to earn your certificate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}