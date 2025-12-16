'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Trophy, AlertCircle, Play, Star, ArrowRight, Lock } from 'lucide-react'; // Added icons
import { useMultipleSkillsProgress, useProgressTracker } from '@/lib/hooks/useProgressTracker';
import { usePerformanceMonitoring } from '@/lib/hooks/usePerformanceMonitoring';
import type { SkillState, DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph as ProgressionSkillGraph } from '@/lib/services/skill-progression-manager';

// Import our components
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
  // Debug render count
  const renderCount = React.useRef(0);
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

  // Progress tracking state
  const [previousProgressData, setPreviousProgressData] = useState<typeof progressData>([]);

  // Performance monitoring
  const { timeAsync } = usePerformanceMonitoring('SkillGraphRenderer');

  // Convert the graph to the format expected by the progress tracker
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
  }, [graph]);

  // Use the progress tracker hook for multiple skills
  const { progressData, loading: progressLoading, error: progressError, refreshProgress: refreshGraphProgress } = useMultipleSkillsProgress(progressionGraph);

  // Use progress tracker for the specific selected skill
  const { recordChallengeAttempt } = useProgressTracker(selectedSkill?.id, selectedSkill?.title);

  // Initialize source map utilities
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

  // Determine the primary Recommended Skill (The Logic for CTA)
  const recommendedSkill = useMemo(() => {
    if (!progressData || progressData.length === 0) return graph.nodes[0];

    // Priority 1: First unlocked skill that isn't mastered
    const nextUp = graph.nodes.find(node => {
      const state = getSkillState(node.id);
      return state === 'unlocked';
    });
    
    // Priority 2: If everything is mastered, show the last one? Or fallback to first.
    if (!nextUp) {
      // Find first locked node (next frontier) or return first node
      return graph.nodes.find(node => getSkillState(node.id) === 'locked') || graph.nodes[0];
    }

    return nextUp;
  }, [graph.nodes, progressData]);


  // Notification management
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

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Modal handlers
  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
  };

  // Notification Listener
  useEffect(() => {
    if (progressData.length === 0) return;
    if (previousProgressData.length === 0) {
      setPreviousProgressData(progressData);
      return;
    }

    progressData.forEach(current => {
      const previous = previousProgressData.find(p => p.skillId === current.skillId);
      if (previous && current.progressData && previous.progressData) {
        if (previous.progressData.state === 'locked' && current.progressData.state === 'unlocked') {
          addNotification('unlock', `🎉 ${current.title} unlocked!`, current.skillId);
        }
        if (!previous.progressData.masteryAchieved && current.progressData.masteryAchieved) {
          addNotification('mastery', `🏆 ${current.title} mastered!`, current.skillId);
        }
        const previousXP = previous.progressData.xpEarned || 0;
        const currentXP = current.progressData.xpEarned || 0;
        const xpGain = currentXP - previousXP;
        if (xpGain > 0) {
          addNotification('xp', `+${xpGain} XP earned!`, current.skillId);
        }
      }
    });

    setPreviousProgressData(progressData);
  }, [progressData]);

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
          
          const skillTitle = skill.title || `Skill ${skill.id}`;
          const skillEngine = skill.engine || 'default';
          
          const batch = await generateChallengeBatch(skill.id, skillTitle, skillEngine);

          if (batch.challenges && batch.challenges.length > 0) {
            setSessionChallenges(batch.challenges);
            setConceptExplanation(batch.explanation || `Learn about ${skillTitle} through hands-on practice.`);
            setActiveChallengeIndex(-1);
          } else {
            const fallbackChallenge: Challenge = {
              id: `fallback_${skill.id}_${Date.now()}`,
              skillId: skill.id,
              title: `Practice ${skillTitle}`,
              description: `Practice your understanding of ${skillTitle} concepts.`,
              engine: skillEngine,
              difficulty: 'Medium',
              estimatedMinutes: 15,
              xpReward: 100,
              starterCode: '',
              validationCriteria: [{ type: 'ai_eval', rubric: 'Demonstrate understanding of the concept.' }],
              hints: ['Take your time to understand the concept', 'Ask for help if needed'],
              explanation: `This is a practice exercise for ${skillTitle}.`
            };
            setSessionChallenges([fallbackChallenge]);
            setConceptExplanation(`Learn about ${skillTitle} through hands-on practice.`);
            setActiveChallengeIndex(-1);
          }
        } catch (e) {
          console.error("Generation failed", e);
          addNotification('error', 'Failed to generate challenges. Please try again.', skillId);
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
      const skillProgress = getSkillProgress(selectedSkill.id);
      if (skillProgress) {
        const progressPercent = Math.round((skillProgress.challengesCompleted / skillProgress.challengesRequired) * 100);
        addNotification('xp', `Progress: ${progressPercent}% complete! +${currentChal.xpReward || 100} XP`, selectedSkill.id);
      }
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

  // Stats calculation
  const totalMinutes = graph.nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);
  const totalXP = graph.nodes.reduce((sum, n) => sum + (n.xpReward || 0), 0);
  const earnedXP = progressData.reduce((sum, p) => sum + (p.progressData.xpEarned || 0), 0);
  const masteredSkills = progressData.filter(p => p.progressData.masteryAchieved).length;
  const unlockedSkills = progressData.filter(p => p.progressData.state === 'unlocked' || p.progressData.state === 'mastered').length;

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
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  // --- RENDER START ---
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

        {/* 1. HERO SECTION: Stats & High Level View */}
        <HeroSection
          graph={graph}
          mousePosition={mousePosition}
          totalMinutes={totalMinutes}
          totalXP={totalXP}
          earnedXP={earnedXP}
          masteredSkills={masteredSkills}
          unlockedSkills={unlockedSkills}
        />

        {/* 2. THE CTA: "Up Next" / Recommended Path 
            Moves the user from "Browsing" to "Doing" immediately. 
        */}
        {recommendedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="my-8 relative group"
          >
            {/* Glowing background effect for the recommended card */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between bg-gray-800 rounded-xl p-6 md:p-8 border border-gray-700">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Recommended Next Step</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {recommendedSkill.title}
                </h2>
                <p className="text-gray-300 max-w-xl text-base md:text-lg">
                  {recommendedSkill.description || "Master the core concepts to unlock advanced challenges."}
                </p>
                
                {/* Mini progress for this specific skill */}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                     <Target className="w-4 h-4 text-indigo-400" />
                     <span>Difficulty: {recommendedSkill.level || 'Medium'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Star className="w-4 h-4 text-yellow-500" />
                     <span>{recommendedSkill.xpReward || 100} XP Reward</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSkillClick(recommendedSkill.id)}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all w-full md:w-auto justify-center"
              >
                <div className="p-1 bg-white/20 rounded-full">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base leading-none">Start Challenge</span>
                  <span className="text-xs font-normal opacity-80 mt-1">~{recommendedSkill.estimatedMinutes || 15} mins</span>
                </div>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 3. THE MAP: Context & Future (Reduced Visual Noise) */}
        <div className="mb-6 flex items-end justify-between border-b border-gray-800 pb-2">
          <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            Full Curriculum
          </h3>
          <span className="text-sm text-gray-500">
             {graph.nodes.length} Skills Total
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {graph.nodes.map((skill, index) => {
            const state = getSkillState(skill.id);
            // We reduce opacity for locked items to lower cognitive load
            // Only the recommended skill (handled above) or unlocked skills pop
            const isRecommended = skill.id === recommendedSkill?.id;
            
            return (
              <div key={skill.id} className={`${state === 'locked' ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all duration-300' : ''}`}>
                <SkillCard
                  skill={skill}
                  index={index}
                  skillState={state}
                  progress={getSkillProgress(skill.id)}
                  unmetPrereqs={getUnmetPrerequisites(skill)}
                  onSkillClick={handleSkillClick}
                  // Pass a flag to the card if you want to highlight it specifically, 
                  // or relying on the "Recommended" section above is usually enough.
                />
              </div>
            );
          })}
        </motion.div>

        {/* Notification System */}
        <NotificationSystem
          notifications={notifications}
          onRemoveNotification={removeNotification}
        />

        {/* Modals */}
        <PrerequisitesModal
          showPrerequisites={showPrerequisites}
          graph={graph}
          getSkillState={getSkillState}
          getSkillProgress={getSkillProgress}
          getUnmetPrerequisites={getUnmetPrerequisites}
          onClose={() => setShowPrerequisites(null)}
          onSkillClick={handleSkillClick}
        />

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
    </div>
  );
}
