'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Sparkles, Trophy, AlertCircle, Play, 
  Star, ArrowRight, Lock, Zap, Map, Crown 
} from 'lucide-react';
import { useMultipleSkillsProgress, useProgressTracker } from '@/lib/hooks/useProgressTracker';
import { usePerformanceMonitoring } from '@/lib/hooks/usePerformanceMonitoring';
import type { SkillState, DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph as ProgressionSkillGraph } from '@/lib/services/skill-progression-manager';

// Component Imports
import NotificationSystem from './components/NotificationSystem';
import PrerequisitesModal from './components/PrerequisitesModal';
import EngineModal from './components/EngineModal';
import { performSourceMapHealthCheck, enhanceConsoleLogging, logComponentError } from './utils/sourceMapUtils';

// --- VISUAL SUB-COMPONENTS ---

const BackgroundGrid = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
  </div>
);

// --- MAIN COMPONENT ---

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
  // --- 1. STATE & HOOKS ---
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [showPrerequisites, setShowPrerequisites] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Session State
  const [sessionChallenges, setSessionChallenges] = useState<Challenge[]>([]);
  const [conceptExplanation, setConceptExplanation] = useState<string>('');
  const [activeChallengeIndex, setActiveChallengeIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);

  // Progress Data Prep
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

  const { progressData, loading: progressLoading, error: progressError, refreshProgress } = useMultipleSkillsProgress(progressionGraph);
  const { recordChallengeAttempt } = useProgressTracker(selectedSkill?.id, selectedSkill?.title);

  // --- 2. LOGIC HELPERS ---

  const getSkillState = useCallback((skillId: string): SkillState => {
    if (!progressData || progressData.length === 0) return 'locked';
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData.state || 'locked';
  }, [progressData]);

  const getUnmetPrerequisites = useCallback((skill: SkillNode): SkillNode[] => {
    if (!skill.prerequisites?.length) return [];
    return skill.prerequisites
      .map(id => graph.nodes.find(n => n.id === id))
      .filter((n): n is SkillNode => !!n && getSkillState(n.id) !== 'mastered');
  }, [graph.nodes, getSkillState]);

  // --- 3. THE "NEXT MISSION" LOGIC (Fixed) ---
  const recommendedSkill = useMemo(() => {
    if (!graph.nodes.length) return null;
    if (progressLoading || progressData.length === 0) return null;

    // A. Look for "In Progress" (Unlocked, started or not started, but NOT mastered)
    const inProgress = graph.nodes.find(node => {
      const state = getSkillState(node.id);
      return state === 'unlocked'; // 'unlocked' implies available but not mastered
    });
    if (inProgress) return inProgress;

    // B. Look for "Ready to Unlock" (Locked, but all parents mastered)
    const nextUnlockable = graph.nodes.find(node => {
      const state = getSkillState(node.id);
      if (state !== 'locked') return false;
      const unmets = getUnmetPrerequisites(node);
      return unmets.length === 0;
    });
    if (nextUnlockable) return nextUnlockable;

    // C. Fallback: If map is empty or everything is locked (shouldn't happen), return start
    return graph.nodes[0];
  }, [graph.nodes, progressData, progressLoading, getSkillState, getUnmetPrerequisites]);


  // --- 4. HANDLERS (Simplified for brevity) ---
  
  const handleSkillClick = async (skillId: string) => {
    const skill = graph.nodes.find(n => n.id === skillId);
    if (!skill) return;
    
    const state = getSkillState(skillId);
    
    // Logic for Locked Skills
    if (state === 'locked') {
      const unmets = getUnmetPrerequisites(skill);
      if (unmets.length > 0) {
        setShowPrerequisites(skillId);
        return;
      }
      // If no unmet prereqs but still locked, it usually means we just need to "Start" it to unlock
    }

    // Logic for Starting/Continuing
    setSelectedSkill(skill);
    
    // Check if we have pre-generated challenges
    if (challenges[skillId]) {
      setSessionChallenges([challenges[skillId]]);
      setActiveChallengeIndex(0);
    } else {
      // Trigger Generation
      setIsGenerating(true);
      try {
        const { generateChallengeBatch } = await import('@/app/actions/generate-challenges');
        const batch = await generateChallengeBatch(skill.id, skill.title, skill.engine || 'default');
        setSessionChallenges(batch.challenges);
        setConceptExplanation(batch.explanation || '');
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleChallengeComplete = async (success: boolean) => {
    if (!selectedSkill || !currentChallenge) return;
    await recordChallengeAttempt(currentChallenge.id, success, progressionGraph, { 
      difficultyLevel: (selectedSkill.level as DifficultyLevel) || 'Medium' 
    });
    await refreshProgress();
    
    if (success) {
      if (activeChallengeIndex < sessionChallenges.length - 1) {
        setActiveChallengeIndex(prev => prev + 1);
        setCurrentChallenge(sessionChallenges[activeChallengeIndex + 1]);
      } else {
        // Session Done
        handleCloseEngine();
      }
    }
  };

  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
    setActiveChallengeIndex(-1);
  };


  // --- 5. RENDER STATES ---

  if (progressLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-indigo-400 font-mono text-sm animate-pulse">SYNCING NEURAL LINK...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0C15] text-white overflow-x-hidden selection:bg-indigo-500/30">
      <BackgroundGrid />
      
      <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12 z-10">
        
        {/* HEADER STATS - Compact & Visual */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-800/60 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Skill Tree
              </span>
            </h1>
            <p className="text-gray-400 font-medium">
              Mastery: {progressData.filter(p => p.progressData.masteryAchieved).length} / {graph.nodes.length} Nodes
            </p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
             <div className="bg-gray-900/50 backdrop-blur border border-gray-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="font-mono font-bold text-yellow-500">
                  {progressData.reduce((acc, curr) => acc + (curr.progressData.xpEarned || 0), 0)} XP
                </span>
             </div>
          </div>
        </header>


        {/* THE "NEXT MISSION" CARD (The main fix for CTA) */}
        {recommendedSkill ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-16 relative group cursor-pointer"
            onClick={() => handleSkillClick(recommendedSkill.id)}
          >
            {/* Animated Glow Behind */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-2xl opacity-75 blur-lg group-hover:opacity-100 group-hover:blur-xl transition duration-500 animate-tilt" />
            
            <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
              {/* Card Content */}
              <div className="flex flex-col md:flex-row">
                
                {/* Left: Graphic Area */}
                <div className="bg-indigo-950/30 p-8 md:w-1/3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/[0.05]" />
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-indigo-500/20 z-10"
                  >
                    <Zap className="w-10 h-10 text-white fill-white" />
                  </motion.div>
                  <div className="mt-6 z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wider uppercase border border-indigo-500/30">
                      Recommended Mission
                    </span>
                  </div>
                </div>

                {/* Right: Info Area */}
                <div className="p-8 md:w-2/3 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                    {recommendedSkill.title}
                  </h2>
                  <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                    {recommendedSkill.description || "Master the core concepts of this skill to unlock advanced capabilities in your developer journey."}
                  </p>
                  
                  <div className="flex flex-wrap gap-6 mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="p-1.5 bg-gray-800 rounded text-cyan-400"><Target size={16} /></div>
                      <span>Difficulty: <span className="text-white font-medium">{recommendedSkill.level || 'Medium'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="p-1.5 bg-gray-800 rounded text-yellow-400"><Star size={16} /></div>
                      <span>Reward: <span className="text-white font-medium">{recommendedSkill.xpReward || 100} XP</span></span>
                    </div>
                  </div>

                  <button className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-indigo-50 px-8 py-4 rounded-lg font-bold text-lg transition-all transform group-hover:translate-x-1">
                    <Play className="fill-current w-5 h-5" />
                    Start Challenge
                    <ArrowRight className="w-5 h-5 opacity-60" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Fallback if no recommended skill found (e.g. everything mastered)
          <div className="mb-16 p-8 bg-green-900/20 border border-green-500/30 rounded-xl text-center">
            <Trophy className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">All Systems Operational</h2>
            <p className="text-gray-400">You have mastered all available skills in this graph.</p>
          </div>
        )}

        {/* SECTION DIVIDER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-800 flex-1" />
          <span className="text-gray-500 uppercase text-xs font-bold tracking-widest flex items-center gap-2">
            <Map className="w-4 h-4" /> Operations Map
          </span>
          <div className="h-px bg-gray-800 flex-1" />
        </div>

        {/* SKILL GRID (Visual Refinement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {graph.nodes.map((skill) => {
            const state = getSkillState(skill.id);
            const isRecommended = skill.id === recommendedSkill?.id;
            
            // Visual Styles based on State
            const isLocked = state === 'locked';
            const isMastered = state === 'mastered';
            
            return (
              <motion.div
                key={skill.id}
                whileHover={{ y: -4 }}
                onClick={() => handleSkillClick(skill.id)}
                className={`
                  relative rounded-xl p-6 border transition-all duration-300 cursor-pointer group overflow-hidden
                  ${isRecommended ? 'border-indigo-500/50 bg-indigo-900/10 ring-1 ring-indigo-500/30' : ''}
                  ${isLocked ? 'border-gray-800 bg-gray-900/40 opacity-70 grayscale' : 'border-gray-700 bg-gray-800/80 hover:border-gray-600 hover:bg-gray-800'}
                  ${isMastered ? 'border-emerald-500/30 bg-emerald-900/10' : ''}
                `}
              >
                {/* Locked Overlay Pattern */}
                {isLocked && (
                  <div className="absolute inset-0 bg-[url('/stripe-pattern.png')] opacity-10" />
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center shadow-lg
                    ${isLocked ? 'bg-gray-800 text-gray-600' : ''}
                    ${state === 'unlocked' ? 'bg-indigo-600 text-white' : ''}
                    ${isMastered ? 'bg-emerald-500 text-white' : ''}
                  `}>
                    {isLocked ? <Lock size={18} /> : isMastered ? <Trophy size={18} /> : <Zap size={18} />}
                  </div>
                  {isMastered && <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Mastered</div>}
                </div>

                <h3 className={`text-lg font-bold mb-2 relative z-10 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                  {skill.title}
                </h3>
                
                <p className={`text-sm mb-4 line-clamp-2 relative z-10 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  {skill.description}
                </p>

                {/* Progress Bar (Fake or Real) */}
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isMastered ? '100%' : '0%' }}
                    className={`h-full ${isMastered ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* --- MODALS & NOTIFICATIONS --- */}
      <NotificationSystem 
        notifications={notifications} 
        onRemoveNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} 
      />

      <PrerequisitesModal
        showPrerequisites={showPrerequisites}
        graph={graph}
        getSkillState={getSkillState}
        getSkillProgress={(id) => progressData.find(p => p.skillId === id)?.progressData || null}
        getUnmetPrerequisites={getUnmetPrerequisites}
        onClose={() => setShowPrerequisites(null)}
        onSkillClick={handleSkillClick}
      />

      <EngineModal
        selectedSkill={selectedSkill}
        sessionChallenges={sessionChallenges}
        conceptExplanation={conceptExplanation}
        activeChallengeIndex={activeChallengeIndex}
        currentChallenge={currentChallenge || sessionChallenges[activeChallengeIndex]}
        isGenerating={isGenerating}
        onClose={handleCloseEngine}
        onChallengeSelect={setActiveChallengeIndex}
        onChallengeComplete={handleChallengeComplete}
      />
    </div>
  );
}
