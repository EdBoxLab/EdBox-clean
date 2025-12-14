'use client';

import React, { useState, useEffect } from 'react';
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
import EngineModal from './components/EngineModal';

// Import source map utilities
import { performSourceMapHealthCheck, enhanceConsoleLogging, logComponentError } from './utils/sourceMapUtils';

// Props for renderer
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
  
  // Progress tracking state
  const [previousProgressData, setPreviousProgressData] = useState<typeof progressData>([]);

  // Performance monitoring
  const { timeAsync } = usePerformanceMonitoring('SkillGraphRenderer');

  // Convert the graph to the format expected by the progress tracker
  const convertToProgressionGraph = (graph: SkillGraph): ProgressionSkillGraph => {
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
  };

  const progressionGraph = convertToProgressionGraph(graph);

  // Use the progress tracker hook for multiple skills
  const { progressData, loading: progressLoading, error: progressError, refreshProgress: refreshGraphProgress } = useMultipleSkillsProgress(progressionGraph);

  // Use progress tracker for the specific selected skill
  const { recordChallengeAttempt } = useProgressTracker(selectedSkill?.id, selectedSkill?.title);

  // Initialize source map utilities and health check
  useEffect(() => {
    try {
      enhanceConsoleLogging();
      performSourceMapHealthCheck();
    } catch (error) {
      logComponentError('SkillGraphRenderer', error as Error, { phase: 'initialization' });
    }
  }, []);

  // Track mouse for background animations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Helper functions
  const getSkillState = (skillId: string): SkillState => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData.state || 'locked';
  };

  const getSkillProgress = (skillId: string) => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData || null;
  };

  const getUnmetPrerequisites = (skill: SkillNode): SkillNode[] => {
    if (!skill.prerequisites || !Array.isArray(skill.prerequisites)) {
      return [];
    }
    return skill.prerequisites
      .map(prereqId => graph.nodes.find(node => node.id === prereqId))
      .filter((prereq): prereq is SkillNode => {
        if (!prereq) return false;
        const state = getSkillState(prereq.id);
        return state !== 'mastered';
      });
  };

  // Notification management
  const addNotification = (type: 'unlock' | 'mastery' | 'xp' | 'error' | 'info', message: string, skillId?: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, skillId }]);

    // Add celebratory effects for mastery
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
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Modal handlers
  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
  };

  // Listen for progress updates to show notifications
  useEffect(() => {
    if (progressData.length === 0 || previousProgressData.length === 0) {
      setPreviousProgressData(progressData);
      return;
    }

    progressData.forEach(current => {
      const previous = previousProgressData.find(p => p.skillId === current.skillId);

      if (previous) {
        if (previous.progressData.state === 'locked' && current.progressData.state === 'unlocked') {
          addNotification('unlock', `🎉 ${current.title} unlocked!`, current.skillId);
        }

        if (!previous.progressData.masteryAchieved && current.progressData.masteryAchieved) {
          addNotification('mastery', `🏆 ${current.title} mastered!`, current.skillId);
        }

        const xpGain = current.progressData.xpEarned - previous.progressData.xpEarned;
        if (xpGain > 0) {
          addNotification('xp', `+${xpGain} XP earned!`, current.skillId);
        }
      }
    });

    setPreviousProgressData(progressData);
  }, [progressData, previousProgressData]);

  // Skill interaction handlers
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
        setIsGenerating(true);
        try {
          const { generateChallengeBatch } = await import('@/app/actions/generate-challenges');
          const batch = await generateChallengeBatch(skill.id, skill.title, skill.engine);

          setSessionChallenges(batch.challenges);
          setConceptExplanation(batch.explanation);
          setActiveChallengeIndex(-1);
        } catch (e) {
          console.error("Generation failed", e);
          addNotification('error', 'Failed to generate challenges', skillId);
        } finally {
          setIsGenerating(false);
        }
      }
    }
  };

  const handleChallengeSelect = (index: number) => {
    setActiveChallengeIndex(index);
    if (index >= 0 && index < sessionChallenges.length) {
      setCurrentChallenge(sessionChallenges[index]);
      setConsecutiveFailures(0);
    } else {
      setCurrentChallenge(null);
    }
  };

  const fetchAdaptiveChallenge = async () => {
    if (!selectedSkill) return;

    setIsGenerating(true);
    try {
      addNotification('info', 'Generating helpful practice challenge...', selectedSkill.id);

      const response = await fetch('/api/challenge/adaptive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkill.id,
          skillTitle: selectedSkill.title,
          engine: selectedSkill.engine,
          userMastery: 0.2,
          previousAttempts: [{ success: false }, { success: false }]
        })
      });

      const data = await response.json();
      if (data.success && data.challenge) {
        const newChallenge = { ...data.challenge, title: `Support: ${data.challenge.title}` };
        const newSession = [...sessionChallenges];
        newSession.splice(activeChallengeIndex + 1, 0, newChallenge);
        setSessionChallenges(newSession);
        setActiveChallengeIndex(prev => prev + 1);
        setCurrentChallenge(newChallenge);
        setConsecutiveFailures(0);
      }
    } catch (error) {
      console.error("Adaptive generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChallengeComplete = async (success: boolean) => {
    if (!selectedSkill || activeChallengeIndex === -1) return;

    const currentChal = sessionChallenges[activeChallengeIndex];
    if (currentChal) {
      await recordChallengeAttempt(
        currentChal.id,
        success,
        progressionGraph,
        { difficultyLevel: (selectedSkill.level as DifficultyLevel) || 'Medium' }
      );
    }

    await refreshGraphProgress();

    if (success) {
      setConsecutiveFailures(0);
      if (activeChallengeIndex < sessionChallenges.length - 1) {
        setTimeout(() => handleChallengeSelect(activeChallengeIndex + 1), 1500);
      } else {
        addNotification('mastery', 'Session Complete! Great work.', selectedSkill.id);
      }
    } else {
      const fails = consecutiveFailures + 1;
      setConsecutiveFailures(fails);

      if (fails >= 2) {
        await fetchAdaptiveChallenge();
      }
    }
  };

  // Calculate stats
  const totalMinutes = graph.nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);
  const totalXP = graph.nodes.reduce((sum, n) => sum + (n.xpReward || 0), 0);
  const earnedXP = progressData.reduce((sum, p) => sum + (p.progressData.xpEarned || 0), 0);
  const masteredSkills = progressData.filter(p => p.progressData.masteryAchieved).length;
  const unlockedSkills = progressData.filter(p => p.progressData.state === 'unlocked' || p.progressData.state === 'mastered').length;

  // Loading and error states
  if (progressLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (progressError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Progress</h2>
          <p className="text-gray-400 mb-4">{progressError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        
        {/* Hero Section */}
        <HeroSection
          graph={graph}
          mousePosition={mousePosition}
          totalMinutes={totalMinutes}
          totalXP={totalXP}
          earnedXP={earnedXP}
          masteredSkills={masteredSkills}
          unlockedSkills={unlockedSkills}
        />

        {/* Skill Graph Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 md:mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Your Learning Path</h2>
              <p className="text-sm text-gray-400 mt-1">
                {masteredSkills} mastered • {unlockedSkills - masteredSkills} available • {graph.nodes.length - unlockedSkills} locked
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                const nextSkill = progressData.find(p =>
                  p.progressData.state === 'unlocked' &&
                  !p.progressData.masteryAchieved &&
                  p.progressData.challengesCompleted < p.progressData.challengesRequired
                );

                return nextSkill ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSkillClick(nextSkill.skillId)}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    <span>Continue: {nextSkill.title}</span>
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Click any skill to start</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Skill Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {graph.nodes.map((skill, index) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              index={index}
              skillState={getSkillState(skill.id)}
              progress={getSkillProgress(skill.id)}
              unmetPrereqs={getUnmetPrerequisites(skill)}
              onSkillClick={handleSkillClick}
            />
          ))}
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {[
            { icon: Target, title: 'Click a Skill', description: 'Select any skill node from your learning path', color: 'from-blue-500 to-cyan-500' },
            { icon: Sparkles, title: 'Practice in Engine', description: 'Solve real challenges in our interactive environment', color: 'from-purple-500 to-pink-500' },
            { icon: Trophy, title: 'Master & Progress', description: 'Unlock new skills as you demonstrate mastery', color: 'from-emerald-500 to-green-500' }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="relative group"
            >
              <div className="relative bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg`}>
                  <step.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-xs md:text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      {/* Prerequisites Modal */}
      <PrerequisitesModal
        showPrerequisites={showPrerequisites}
        graph={graph}
        getSkillState={getSkillState}
        getSkillProgress={getSkillProgress}
        getUnmetPrerequisites={getUnmetPrerequisites}
        onClose={() => setShowPrerequisites(null)}
        onSkillClick={handleSkillClick}
      />

      {/* Engine Modal */}
      <EngineModal
        selectedSkill={selectedSkill}
        sessionChallenges={sessionChallenges}
        conceptExplanation={conceptExplanation}
        activeChallengeIndex={activeChallengeIndex}
        currentChallenge={currentChallenge}
        isGenerating={isGenerating}
        onClose={handleCloseEngine}
        onChallengeSelect={handleChallengeSelect}
        onChallengeComplete={handleChallengeComplete}
      />
    </div>
  );
}