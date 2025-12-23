'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import { motion } from 'framer-motion';
import { Target, Sparkles, Trophy, AlertCircle } from 'lucide-react';
import { useMultipleSkillsProgress, useProgressTracker } from '@/lib/hooks/useProgressTracker';
import { usePerformanceMonitoring } from '@/lib/hooks/usePerformanceMonitoring';
import type { SkillState, DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph as ProgressionSkillGraph } from '@/lib/services/skill-progression-manager';

// Import our new components
import HeroSection from './components/HeroSection';
import SkillCard from './components/SkillCard';
import NotificationSystem from './components/NotificationSystem';
import PrerequisitesModal from './components/PrerequisitesModal';
import EngineModal from './components/ImmersiveEngineView';

// Import source map utilities
import { performSourceMapHealthCheck, enhanceConsoleLogging, logComponentError } from './utils/sourceMapUtils';

interface SkillGraphRendererProps {
  graph: SkillGraph;
  challenges?: Record<string, Challenge>;
}

interface Notification {
  id: string;
  type: 'unlock' | 'mastery' | 'xp' | 'error' | 'info';
  message: string;
  skillId?: string;
}

export default function SkillGraphRenderer({ graph, challenges = {} }: SkillGraphRendererProps) {
  // Debug render count
  const renderCount = useRef(0);
  renderCount.current += 1;

  if (renderCount.current > 100) {
    console.error('SkillGraphRenderer: Excessive renders detected!', renderCount.current);
  }

  // Core state
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPrerequisites, setShowPrerequisites] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Session state for challenges
  const [sessionChallenges, setSessionChallenges] = useState<Challenge[]>([]);
  const [conceptExplanation, setConceptExplanation] = useState<string>('');
  const [activeChallengeIndex, setActiveChallengeIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  // --- FIX 1: Use a Ref instead of State to track progress history ---
  // This prevents setPreviousProgressData from triggering a re-render loop.
  const lastNotifiedDataRef = useRef<any[]>([]);

  // Performance monitoring
  const { timeAsync } = usePerformanceMonitoring('SkillGraphRenderer');

  // --- FIX 2: Stabilize the dependency array ---
  // Using graph.id (a string) instead of the graph object itself ensures 
  // this only re-calculates when the actual data source changes.
  const progressionGraph = useMemo((): ProgressionSkillGraph => {
    return {
      nodes: graph.nodes.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description,
        prerequisites: node.prerequisites || [],
        engine: node.engine || 'default',
        difficulty: (node.level as DifficultyLevel) || 'Medium'
      })),
      edges: graph.edges || []
    };
  }, [graph.id]); // Changed from [graph]

  const { progressData, loading: progressLoading, error: progressError, refreshProgress: refreshGraphProgress } = useMultipleSkillsProgress(progressionGraph);
  const { recordChallengeAttempt } = useProgressTracker(selectedSkill?.id, selectedSkill?.title);

  useEffect(() => {
    try {
      enhanceConsoleLogging();
      performSourceMapHealthCheck();
    } catch (error) {
      logComponentError('SkillGraphRenderer', error as Error, { phase: 'initialization' });
    }
  }, []);

  useEffect(() => {
    let lastMove = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove > 50) { // Throttle to 20fps
        setMousePosition({ x: e.clientX, y: e.clientY });
        lastMove = now;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const addNotification = useCallback((type: 'unlock' | 'mastery' | 'xp' | 'error' | 'info', message: string, skillId?: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, skillId }]);

    if (type === 'mastery') {
      const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = 'fixed w-2 h-2 rounded-full pointer-events-none z-50';
          particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          particle.style.left = Math.random() * window.innerWidth + 'px';
          particle.style.top = '20px';
          document.body.appendChild(particle);

          particle.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(720deg)`, opacity: 0 }
          ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }).onfinish = () => particle.remove();
        }, i * 100);
      }
    }

    const duration = type === 'mastery' ? 8000 : 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // --- FIX 3: Rewritten logic for notifications using the Ref ---
  useEffect(() => {
    if (progressData.length === 0) return;

    // Only compare if we have stored data from a previous render
    if (lastNotifiedDataRef.current.length > 0) {
      progressData.forEach(current => {
        const previous = lastNotifiedDataRef.current.find(p => p.skillId === current.skillId);

        if (previous?.progressData && current.progressData) {
          // Check for unlock
          if (previous.progressData.state === 'locked' && current.progressData.state === 'unlocked') {
            addNotification('unlock', `🎉 ${current.title} unlocked!`, current.skillId);
          }
          // Check for mastery
          if (!previous.progressData.masteryAchieved && current.progressData.masteryAchieved) {
            addNotification('mastery', `🏆 ${current.title} mastered!`, current.skillId);
          }
          // Check for XP gain
          const previousXP = previous.progressData.xpEarned || 0;
          const currentXP = current.progressData.xpEarned || 0;
          if (currentXP > previousXP) {
            addNotification('xp', `+${currentXP - previousXP} XP earned!`, current.skillId);
          }
        }
      });
    }

    // Update the ref to the current data. 
    // This happens at the end of the render cycle and does NOT trigger a new render.
    lastNotifiedDataRef.current = progressData;
  }, [progressData, addNotification]);

  // (rest of your helper functions and handlers remain the same)
  const getSkillState = (skillId: string): SkillState => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData.state || 'locked';
  };

  const getSkillProgress = (skillId: string) => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData || null;
  };

  const getUnmetPrerequisites = (skill: SkillNode): SkillNode[] => {
    if (!skill.prerequisites || !Array.isArray(skill.prerequisites)) return [];
    return skill.prerequisites
      .map(prereqId => graph.nodes.find(node => node.id === prereqId))
      .filter((prereq): prereq is SkillNode => {
        if (!prereq) return false;
        return getSkillState(prereq.id) !== 'mastered';
      });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
  };

  const handleSkillClick = async (skillId: string) => {
    const skill = graph.nodes.find((n) => n.id === skillId) || null;
    if (!skill) return;
    const skillState = getSkillState(skillId);

    if (skillState === 'locked') {
      const unmetPrereqs = getUnmetPrerequisites(skill);
      if (unmetPrereqs.length > 0) {
        setShowPrerequisites(skillId);
        return;
      }
    }

    if (skillState === 'unlocked' || skillState === 'mastered') {
      setSelectedSkill(skill);
      setSessionChallenges([]);
      setConceptExplanation('');
      setActiveChallengeIndex(-1);
      setConsecutiveFailures(0);

      const existing = challenges[skillId];
      if (existing) {
        setSessionChallenges([existing]);
        setConceptExplanation(existing.explanation || "Let's dive in!");
        setActiveChallengeIndex(0);
      } else {
        // No pre-generated challenges, just start interactive session
        const skillTitle = skill.title || (skill as any).name || skill.id;
        setConceptExplanation(`Let's learn about ${skillTitle}!`);
        setSessionChallenges([]);
        setActiveChallengeIndex(-1);
      }
    }
  };

  const handleChallengeSelect = (index: number) => {
    setActiveChallengeIndex(index);
    setCurrentChallenge(sessionChallenges[index] || null);
  };

  const handleChallengeComplete = async (success: boolean) => {
    if (!selectedSkill || activeChallengeIndex === -1) return;
    const currentChal = sessionChallenges[activeChallengeIndex];
    if (currentChal) {
      await recordChallengeAttempt(currentChal.id, success, progressionGraph, {
        difficultyLevel: (selectedSkill.level as DifficultyLevel) || 'Medium'
      });
    }
    await refreshGraphProgress();
    if (success) {
      setConsecutiveFailures(0);
      if (activeChallengeIndex < sessionChallenges.length - 1) {
        setTimeout(() => handleChallengeSelect(activeChallengeIndex + 1), 1500);
      }
    } else {
      setConsecutiveFailures(prev => prev + 1);
    }
  };

  // Stats calculation with defensive checks
  const totalMinutes = useMemo(() => (graph?.nodes || []).reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0), [graph?.id]);
  const totalXP = useMemo(() => (graph?.nodes || []).reduce((sum, n) => sum + (n.xpReward || 0), 0), [graph?.id]);
  const earnedXP = progressData.reduce((sum, p) => sum + (p.progressData.xpEarned || 0), 0);
  const masteredSkills = progressData.filter(p => p.progressData.masteryAchieved).length;
  const unlockedSkills = progressData.filter(p => p.progressData.state !== 'locked').length;

  if (progressLoading) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (progressError) return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p>{progressError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <HeroSection
          graph={graph} mousePosition={mousePosition} totalMinutes={totalMinutes}
          totalXP={totalXP} earnedXP={earnedXP} masteredSkills={masteredSkills} unlockedSkills={unlockedSkills}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-bold">Your Learning Path</h2>
            {/* Share button can be added here */}
            {/* 
            <ShareButton
              content={{
                type: 'learning-path',
                id: graph.id,
                title: graph.goal,
                description: `Master ${graph.goal} with this personalized learning path`,
                creatorName: 'EdBox AI'
              }}
              userId={userId}
              variant="icon"
              size="sm"
              showCount={true}
            />
            */}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {(graph?.nodes || []).map((skill, index) => (
            <SkillCard
              key={skill.id} skill={skill} index={index}
              skillState={getSkillState(skill.id)}
              progress={getSkillProgress(skill.id)}
              unmetPrereqs={getUnmetPrerequisites(skill)}
              onSkillClick={handleSkillClick}
            />
          ))}
        </div>
      </div>

      <NotificationSystem notifications={notifications} onRemoveNotification={removeNotification} />
      <PrerequisitesModal
        showPrerequisites={showPrerequisites} graph={graph}
        getSkillState={getSkillState} getSkillProgress={getSkillProgress}
        getUnmetPrerequisites={getUnmetPrerequisites}
        onClose={() => setShowPrerequisites(null)} onSkillClick={handleSkillClick}
      />
      <EngineModal
        selectedSkill={selectedSkill} sessionChallenges={sessionChallenges}
        activeChallengeIndex={activeChallengeIndex} currentChallenge={currentChallenge}
        isGenerating={isGenerating} onClose={handleCloseEngine}
        onChallengeSelect={handleChallengeSelect} onChallengeComplete={handleChallengeComplete}
      />
    </div>
  );
}