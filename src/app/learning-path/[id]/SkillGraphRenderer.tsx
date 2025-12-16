'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Sparkles, Trophy, Lock, Play, 
  Star, ArrowRight, Zap, BookOpen, AlertCircle, CheckCircle 
} from 'lucide-react';

// Hooks & Types
import { useMultipleSkillsProgress, useProgressTracker } from '@/lib/hooks/useProgressTracker';
import type { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import type { SkillState, DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph as ProgressionSkillGraph } from '@/lib/services/skill-progression-manager';

// Sub-components
import NotificationSystem from './components/NotificationSystem';
import PrerequisitesModal from './components/PrerequisitesModal';
import EngineModal from './components/EngineModal';

// --- PROPS ---
interface SkillGraphRendererProps {
  graph: SkillGraph;
  courseTitle?: string;
  challenges?: Record<string, Challenge>;
}

interface Notification {
  id: string;
  type: 'unlock' | 'mastery' | 'xp' | 'error' | 'info';
  message: string;
  skillId?: string;
}

export default function SkillGraphRenderer({ 
  graph, 
  courseTitle = "Course Curriculum", 
  challenges = {} 
}: SkillGraphRendererProps) {

  // --- STATE MANAGEMENT ---
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPrerequisites, setShowPrerequisites] = useState<string | null>(null);

  // Engine / Session State
  const [sessionChallenges, setSessionChallenges] = useState<Challenge[]>([]);
  const [activeChallengeIndex, setActiveChallengeIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conceptExplanation, setConceptExplanation] = useState<string>('');

  // --- PROGRESS TRACKING INIT ---
  
  // Transform graph for the progress hook
  const progressionGraph = useMemo((): ProgressionSkillGraph => ({
    nodes: graph.nodes.map(node => ({
      id: node.id,
      title: node.title,
      description: node.description,
      prerequisites: node.prerequisites || [],
      engine: node.engine || 'default',
      difficulty: (node.level as DifficultyLevel) || 'Medium'
    })),
    edges: graph.edges || []
  }), [graph]);

  // Load Progress
  const { 
    progressData, 
    loading: progressLoading, 
    refreshProgress 
  } = useMultipleSkillsProgress(progressionGraph);

  // Challenge Tracker
  const { recordChallengeAttempt } = useProgressTracker(selectedSkill?.id, selectedSkill?.title);

  // --- HELPER LOGIC ---

  const getSkillState = useCallback((skillId: string): SkillState => {
    if (!progressData || progressData.length === 0) return 'locked';
    const data = progressData.find(p => p.skillId === skillId);
    return data?.progressData.state || 'locked';
  }, [progressData]);

  const getSkillProgress = useCallback((skillId: string) => {
    return progressData.find(p => p.skillId === skillId)?.progressData || null;
  }, [progressData]);

  const getUnmetPrerequisites = useCallback((skill: SkillNode) => {
    if (!skill.prerequisites?.length) return [];
    return skill.prerequisites
      .map(id => graph.nodes.find(n => n.id === id))
      .filter((n): n is SkillNode => {
        if (!n) return false;
        const state = getSkillState(n.id);
        return state !== 'mastered';
      });
  }, [graph.nodes, getSkillState]);

  // --- RECALCULATE "RECOMMENDED PATH" ---
  const recommendedSkill = useMemo(() => {
    // 1. Handle loading and empty graph states
    if (progressLoading || !graph.nodes.length) return null;

    // 2. Find In-Progress (Unlocked but not Mastered)
    const inProgress = graph.nodes.find(n => getSkillState(n.id) === 'unlocked');
    if (inProgress) return inProgress;

    // 3. Find Next Unlockable (Locked but prereqs met)
    const nextUp = graph.nodes.find(n => {
      // Check if node is currently locked
      if (getSkillState(n.id) !== 'locked') return false;
      // Check if all prerequisites are met (unmet length is 0)
      return getUnmetPrerequisites(n).length === 0;
    });
    if (nextUp) return nextUp;

    // 4. Fallback: If nothing is in progress and nothing is unlockable, 
    //    return the very first skill if it's not yet mastered.
    const firstSkill = graph.nodes[0];
    if (firstSkill && getSkillState(firstSkill.id) !== 'mastered') {
        return firstSkill;
    }
    
    // 5. Default return null (e.g., if everything is mastered)
    return null; 
  }, [graph.nodes, progressLoading, getSkillState, getUnmetPrerequisites]);


  // --- INTERACTION HANDLERS ---

  const handleSkillClick = async (skillId: string) => {
    const skill = graph.nodes.find(n => n.id === skillId);
    if (!skill) return;

    const state = getSkillState(skillId);

    // Locked Logic
    if (state === 'locked') {
      const unmet = getUnmetPrerequisites(skill);
      if (unmet.length > 0) {
        setShowPrerequisites(skillId);
      } else {
        // Ready to start/unlock
        setSelectedSkill(skill);
        startSession(skill);
      }
      return;
    }

    // Unlocked/In-Progress Logic
    setSelectedSkill(skill);
    startSession(skill);
  };

  const startSession = async (skill: SkillNode) => {
    // 1. Reset State
    setSessionChallenges([]);
    setActiveChallengeIndex(-1);
    setConceptExplanation('');

    // 2. Load Existing or Generate
    if (challenges[skill.id]) {
      setSessionChallenges([challenges[skill.id]]);
      setConceptExplanation(challenges[skill.id].explanation || '');
      setActiveChallengeIndex(0);
    } else {
      setIsGenerating(true);
      try {
        const { generateChallengeBatch } = await import('@/app/actions/generate-challenges');
        const batch = await generateChallengeBatch(skill.id, skill.title, skill.engine || 'default');
        
        if (batch?.challenges?.length) {
          setSessionChallenges(batch.challenges);
          setConceptExplanation(batch.explanation || '');
          setActiveChallengeIndex(-1); // Show intro modal first
        } else {
            // Fallback for demo/error (FIX: Added hints and explanation)
            setSessionChallenges([{
                id: `fallback-${Date.now()}`,
                skillId: skill.id,
                title: `Practice: ${skill.title}`,
                description: "AI generation failed. Practice freely.",
                engine: skill.engine || 'default',
                difficulty: 'Medium',
                xpReward: 50,
                validationCriteria: [],
                hints: [], // Required by Challenge interface
                explanation: "This is a fallback practice challenge because the AI challenge generation service is currently unavailable.", // Required by Challenge interface
            }]);
            setConceptExplanation("No generated challenges available.");
            setActiveChallengeIndex(0);
        }
      } catch (e) {
        console.error("Generator Error:", e);
        setNotifications(prev => [...prev, { id: Date.now().toString(), type: 'error', message: 'Could not generate challenges.' }]);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleChallengeComplete = async (success: boolean) => {
    if (!selectedSkill || !currentChallenge) return;

    // Record Attempt
    await recordChallengeAttempt(currentChallenge.id, success, progressionGraph, {
      difficultyLevel: (selectedSkill.level as DifficultyLevel) || 'Medium'
    });
    await refreshProgress();

    if (success) {
      if (activeChallengeIndex < sessionChallenges.length - 1) {
        // Next challenge
        const nextIdx = activeChallengeIndex + 1;
        setActiveChallengeIndex(nextIdx);
        setCurrentChallenge(sessionChallenges[nextIdx]);
      } else {
        // Finished
        setNotifications(prev => [...prev, { id: Date.now().toString(), type: 'mastery', message: `Completed ${selectedSkill.title}!` }]);
        setSelectedSkill(null);
        setCurrentChallenge(null);
      }
    }
  };


  // --- RENDER ---

  if (progressLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading Course Data...</p>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const currentXP = progressData.reduce((acc, p) => acc + (p.progressData.xpEarned || 0), 0);
  const masteredCount = progressData.filter(p => p.progressData.masteryAchieved).length;
  const progressPercent = graph.nodes.length > 0 ? Math.round((masteredCount / graph.nodes.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* 1. HERO HEADER */}
      <div className="relative bg-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 bg-indigo-500/5 bg-[url('/grid.svg')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wider text-xs uppercase mb-2">
                <BookOpen size={14} />
                Course Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {courseTitle}
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl text-lg">
                Master the curriculum by completing the skill nodes below.
              </p>
            </div>

            {/* Global Stats */}
            <div className="flex items-center gap-6 bg-gray-950/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-white">{progressPercent}%</div>
                <div className="text-xs text-gray-500 uppercase font-bold">Complete</div>
              </div>
              <div className="w-px h-10 bg-gray-800" />
              <div className="text-center px-2">
                <div className="text-2xl font-bold text-yellow-400">{currentXP}</div>
                <div className="text-xs text-yellow-600/80 uppercase font-bold">XP Earned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* 2. THE RECOMMENDED ACTION (CTA) */}
        {recommendedSkill ? (
          <div className="mb-12">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              Current Objective
            </h3>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSkillClick(recommendedSkill.id)}
              className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 to-gray-900 border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-300 shadow-2xl shadow-indigo-900/20 cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/20 mb-3">
                    <Target size={12} />
                    RECOMMENDED NEXT STEP
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    {recommendedSkill.title}
                  </h2>
                  <p className="text-gray-300 text-lg leading-relaxed max-w-2xl">
                    {recommendedSkill.description || "Master this core concept to unlock advanced topics."}
                  </p>
                  
                  <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{recommendedSkill.xpReward || 100} XP Reward</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Target className="w-4 h-4 text-cyan-500" />
                      <span>{recommendedSkill.level || 'Medium'} Difficulty</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents double-triggering from parent div click
                    handleSkillClick(recommendedSkill.id);
                  }}
                  className="whitespace-nowrap flex items-center gap-3 px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-950 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Play className="fill-current w-5 h-5" />
                  Start Challenge
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
           // Fallback if no recommended skill exists (e.g., everything mastered)
           <div className="mb-12 p-8 bg-green-900/20 border border-green-500/30 rounded-xl text-center">
                <Trophy className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white">Mission Complete!</h2>
                <p className="text-gray-400">You have mastered all available skills in this curriculum.</p>
           </div>
        )}

        {/* 3. SKILL GRID */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Full Curriculum
          </h3>
          <span className="text-xs text-gray-600 bg-gray-900 px-2 py-1 rounded border border-gray-800">
            {graph.nodes.length} Modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {graph.nodes.map((skill, i) => {
            const state = getSkillState(skill.id);
            const isMastered = state === 'mastered';
            const isLocked = state === 'locked';
            const isActive = skill.id === recommendedSkill?.id;
            
            // Logic for "Why is this locked?"
            const unmetPrereqs = isLocked ? getUnmetPrerequisites(skill) : [];
            const prereqName = unmetPrereqs.length > 0 ? unmetPrereqs[0].title : null;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSkillClick(skill.id)}
                className={`
                  relative p-6 rounded-xl border flex flex-col h-full transition-all duration-300 group
                  ${isActive ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-900/20' : ''}
                  ${isMastered 
                    ? 'bg-gradient-to-br from-gray-900 to-gray-900 border-emerald-500/30' 
                    : isLocked 
                      ? 'bg-gray-950/80 border-gray-800 hover:border-gray-700' 
                      : 'bg-gray-900 border-gray-700 hover:border-indigo-500/50'
                  }
                  cursor-pointer
                `}
              >
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isMastered ? 'bg-emerald-500/10 text-emerald-400' : 
                      isLocked ? 'bg-gray-900 border border-gray-800 text-gray-500' : 
                      'bg-indigo-500/10 text-indigo-400'}
                  `}>
                    {isMastered ? <CheckCircle size={20} /> : 
                     isLocked ? <Lock size={18} /> : 
                     <Zap size={20} />}
                  </div>
                  
                  {isMastered && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20">
                      Mastered
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4 className={`text-lg font-bold mb-2 ${isMastered ? 'text-emerald-50' : isLocked ? 'text-gray-400' : 'text-white'}`}>
                    {skill.title}
                  </h4>
                  <p className={`text-sm leading-relaxed mb-4 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                    {skill.description}
                  </p>
                </div>

                {/* Footer / Connectors */}
                <div className="pt-4 border-t border-gray-800/50 mt-auto">
                  {isLocked && prereqName ? (
                    <div className="flex items-center gap-2 text-xs text-orange-400/80 font-medium">
                      <Lock size={12} />
                      <span>Requires: {prereqName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>{skill.level || 'Medium'}</span>
                      <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                        {skill.estimatedMinutes || 15}m <ArrowRight size={12} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtle Progress Bar */}
                {state !== 'locked' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-xl overflow-hidden">
                    <div 
                      className={`h-full ${isMastered ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                      style={{ width: isMastered ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* --- MODALS --- */}
      <NotificationSystem 
        notifications={notifications} 
        onRemoveNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />

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
        currentChallenge={currentChallenge || sessionChallenges[activeChallengeIndex] || null} 
        isGenerating={isGenerating}
        onClose={() => {
          setSelectedSkill(null);
          setCurrentChallenge(null);
          setActiveChallengeIndex(-1);
        }}
        onChallengeSelect={(idx) => {
            setActiveChallengeIndex(idx);
            setCurrentChallenge(sessionChallenges[idx]);
        }}
        onChallengeComplete={handleChallengeComplete}
      />
    </div>
  );
}
