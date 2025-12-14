'use client';

import React, { useState, useEffect } from 'react';
import { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import { EngineType } from '@/app/api/learning-path/generate/types/enums';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { X, Sparkles, Trophy, Clock, Target, Zap, Lock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useMultipleSkillsProgress } from '@/lib/hooks/useProgressTracker';
import { usePerformanceMonitoring } from '@/lib/hooks/usePerformanceMonitoring';
import { skillGraphOptimizer } from '@/lib/services/skill-graph-optimizer';
import type { SkillState, DifficultyLevel } from '@/types/skill-progression';
import type { SkillGraph as ProgressionSkillGraph } from '@/lib/services/skill-progression-manager';

// Dynamic imports for engines
const CodeStudio = dynamic(() => import('@/lib/courseCreation/engines/codestudio/App'), { ssr: false });
const WriteLab = dynamic(() => import('@/lib/courseCreation/engines/writingstudio/App'), { ssr: false });
const MathLab = dynamic(() => import('@/lib/courseCreation/engines/mathlab/App'), { ssr: false });
const LinguaLab = dynamic(() => import('@/lib/courseCreation/engines/lingualab/App'), { ssr: false });

// Props for renderer
interface SkillGraphRendererProps {
  graph: SkillGraph;
  challenges?: Record<string, Challenge>;
}

const randomGradient = () =>
  `linear-gradient(135deg, hsl(${Math.random() * 360}, 70%, 50%) 0%, hsl(${Math.random() * 360}, 70%, 60%) 100%)`;

export default function SkillGraphRenderer({ graph, challenges = {} }: SkillGraphRendererProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPrerequisites, setShowPrerequisites] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'unlock' | 'mastery' | 'xp';
    message: string;
    skillId?: string;
  }>>([]);
  const [viewport, setViewport] = useState(() => {
    const progressionGraph = {
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
    return skillGraphOptimizer.getOptimalViewport(progressionGraph);
  });
  const [optimizedGraph, setOptimizedGraph] = useState<any>(null);

  // Performance monitoring
  const { timeAsync, timeSync } = usePerformanceMonitoring('SkillGraphRenderer');

  // Convert the graph to the format expected by the progress tracker
  const convertToProgressionGraph = (graph: SkillGraph): ProgressionSkillGraph => {
    return {
      nodes: graph.nodes.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description,
        prerequisites: node.prerequisites || [],
        engine: node.engine || 'default',
        difficulty: (node.level as DifficultyLevel) || 'Medium' // Convert level to difficulty
      })),
      edges: graph.edges || []
    };
  };

  const progressionGraph = convertToProgressionGraph(graph);

  // Use the progress tracker hook for multiple skills
  const { progressData, loading: progressLoading, error: progressError } = useMultipleSkillsProgress(progressionGraph);

  // Optimize graph for rendering when progress data changes
  useEffect(() => {
    if (progressData.length > 0) {
      timeAsync('graph_optimization', async () => {
        const skillStates = new Map<string, SkillState>();
        progressData.forEach(p => {
          skillStates.set(p.skillId, p.progressData.state || 'locked');
        });

        const optimized = skillGraphOptimizer.optimizeForRendering(
          progressionGraph,
          skillStates,
          viewport
        );
        
        setOptimizedGraph(optimized);
      });
    }
  }, [progressData, viewport, progressionGraph, timeAsync]);

  // Track mouse for background animations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Helper function to get skill state
  const getSkillState = (skillId: string): SkillState => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData.state || 'locked';
  };

  // Helper function to get progress data for a skill
  const getSkillProgress = (skillId: string) => {
    const skillProgress = progressData.find(p => p.skillId === skillId);
    return skillProgress?.progressData || null;
  };

  // Helper function to get unmet prerequisites
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

  // Add notification with enhanced animations
  const addNotification = (type: 'unlock' | 'mastery' | 'xp', message: string, skillId?: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, skillId }]);
    
    // Add celebratory effects for mastery
    if (type === 'mastery') {
      // Trigger confetti-like animation
      const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = 'fixed w-2 h-2 rounded-full pointer-events-none z-50';
          particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          particle.style.left = Math.random() * window.innerWidth + 'px';
          particle.style.top = '20px';
          document.body.appendChild(particle);
          
          // Animate particle
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
    
    // Auto-remove after 6 seconds (longer for mastery notifications)
    const duration = type === 'mastery' ? 8000 : 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Track previous progress data to detect state changes
  const [previousProgressData, setPreviousProgressData] = useState<typeof progressData>([]);

  // Listen for progress updates to show notifications
  useEffect(() => {
    if (progressData.length === 0 || previousProgressData.length === 0) {
      setPreviousProgressData(progressData);
      return;
    }

    // Compare current and previous progress to detect changes
    progressData.forEach(current => {
      const previous = previousProgressData.find(p => p.skillId === current.skillId);
      
      if (previous) {
        // Check for skill unlocking
        if (previous.progressData.state === 'locked' && current.progressData.state === 'unlocked') {
          addNotification('unlock', `🎉 ${current.title} unlocked!`, current.skillId);
        }
        
        // Check for mastery achievement
        if (!previous.progressData.masteryAchieved && current.progressData.masteryAchieved) {
          addNotification('mastery', `🏆 ${current.title} mastered!`, current.skillId);
        }
        
        // Check for significant XP gains
        const xpGain = current.progressData.xpEarned - previous.progressData.xpEarned;
        if (xpGain > 0) {
          addNotification('xp', `+${xpGain} XP earned!`, current.skillId);
        }
      }
    });

    setPreviousProgressData(progressData);
  }, [progressData, previousProgressData]);

  // Handle skill click with enhanced feedback
  const handleSkillClick = (skillId: string) => {
    const skill = graph.nodes.find((n) => n.id === skillId) || null;
    if (!skill) return;

    const skillState = getSkillState(skillId);
    const progress = getSkillProgress(skillId);

    // If skill is locked, show prerequisites instead of opening challenge
    if (skillState === 'locked') {
      const unmetPrereqs = getUnmetPrerequisites(skill);
      if (unmetPrereqs.length > 0) {
        setShowPrerequisites(skillId);
        // Add haptic feedback for locked skills
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
        return;
      }
    }

    // If skill is unlocked or mastered, open the challenge selection
    if (skillState === 'unlocked' || skillState === 'mastered') {
      setSelectedSkill(skill);

      // Use challenge override if exists, else derive from skill
      const challenge: Challenge = challenges[skillId] || {
        skillId: skill.id,
        title: skill.title,
        description: skill.description,
        engine: skill.engine,
        estimatedMinutes: skill.estimatedMinutes || 20,
        xpReward: skill.xpReward || 100,
        validationCriteria: [],
        starterCode: '',
        difficulty: 'Easy',
        hints: [],
        explanation: '',
      };

      setCurrentChallenge(challenge);

      // Add success haptic feedback for accessible skills
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      // Show contextual notification for first-time skill access
      if (progress && progress.challengesCompleted === 0 && skillState === 'unlocked') {
        addNotification('unlock', `Starting ${skill.title}! Complete challenges to master this skill.`, skillId);
      }
    }
  };

  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
  };

  // Render engine based on type
  const renderEngine = () => {
    if (!currentChallenge) return null;
    console.log('Current challenge engine:', currentChallenge.engine);
    
    // Convert engine to string for comparison since it comes from the database as a string
    const engineStr = String(currentChallenge.engine).toLowerCase();
    
    switch (engineStr) {
      case 'codestudio':
        return <CodeStudio challenge={currentChallenge} />;
      case 'writingstudio':
        return <WriteLab challenge={currentChallenge} />;
      case 'mathlab':
        return <MathLab challenge={currentChallenge} />;
      case 'lingualab':
        return <LinguaLab challenge={currentChallenge} />;
      case 'finlab':
        return <WriteLab challenge={currentChallenge} />; // Default fallback
      default:
        console.log('No matching engine for:', engineStr);
        return <div className="text-white">Engine not available for: {engineStr}</div>;
    }
  };

  // Aggregate totals with progress awareness
  const totalMinutes = graph.nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);
  const totalXP = graph.nodes.reduce((sum, n) => sum + (n.xpReward || 0), 0);
  const earnedXP = progressData.reduce((sum, p) => sum + (p.progressData.xpEarned || 0), 0);
  const masteredSkills = progressData.filter(p => p.progressData.masteryAchieved).length;
  const unlockedSkills = progressData.filter(p => p.progressData.state === 'unlocked' || p.progressData.state === 'mastered').length;

  // Show loading state while progress data is loading
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

  // Show error state if progress data failed to load
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 md:mb-12 relative"
        >
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-12">
            {/* Morphing Gradient */}
            <motion.div
              className="absolute inset-0"
              animate={{ 
                background: [
                  randomGradient(), 
                  randomGradient(), 
                  randomGradient()
                ] 
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '400% 400%' }}
            />
            
            {/* Warping Blobs */}
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
              style={{ 
                background: 'radial-gradient(circle, rgba(255,0,255,0.7) 0%, transparent 70%)', 
                left: mousePosition.x * 0.05, 
                top: mousePosition.y * 0.05 
              }}
              animate={{ scale: [1, 1.2, 0.8, 1], x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
              style={{ 
                background: 'radial-gradient(circle, rgba(0,255,255,0.7) 0%, transparent 70%)', 
                right: mousePosition.x * 0.03, 
                bottom: mousePosition.y * 0.03 
              }}
              animate={{ scale: [1, 0.8, 1.3, 1], x: [0, -40, 40, 0], y: [0, 40, -40, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 0.9, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-white/90 font-bold uppercase tracking-widest mb-1">
                    Engine-Native Learning
                  </p>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white">
                    {graph.goal}
                  </h1>
                </div>
              </div>

              <p className="text-sm md:text-lg text-white/95 mb-4 md:mb-6 max-w-2xl font-medium">
                Master skills through hands-on practice. No passive videos—just real challenges that build your abilities progressively.
              </p>

              {/* Overall Progress Bar */}
              {graph.nodes.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center justify-between text-sm text-white/90 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round((masteredSkills / graph.nodes.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(masteredSkills / graph.nodes.length) * 100}%` }}
                      transition={{ duration: 2, delay: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/70 mt-1">
                    <span>{masteredSkills} mastered</span>
                    <span>{graph.nodes.length - masteredSkills} remaining</span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4">
                {[
                  { icon: Target, label: `${masteredSkills}/${graph.nodes.length} Mastered`, color: '#00ff00' },
                  { icon: Zap, label: `${unlockedSkills} Unlocked`, color: '#00ffff' },
                  { icon: Trophy, label: `${earnedXP}/${totalXP} XP`, color: '#ffff00' },
                  { icon: Clock, label: `${totalMinutes} min total`, color: '#ff00ff' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/30 relative overflow-hidden"
                    whileHover={{ scale: 1.05, borderColor: stat.color }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ boxShadow: [`0 0 10px ${stat.color}40`, `0 0 20px ${stat.color}60`] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  >
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    <span className="text-xs md:text-sm font-bold">{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

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
                // Find next recommended skill (unlocked but not mastered)
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
                    <Zap className="w-4 h-4" />
                    <span>Click any skill to start</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Skill Graph Nodes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {graph.nodes.map((skill, index) => {
            const skillState = getSkillState(skill.id);
            const progress = getSkillProgress(skill.id);
            const unmetPrereqs = getUnmetPrerequisites(skill);
            
            // Determine colors and styles based on state
            const getStateStyles = () => {
              switch (skillState) {
                case 'mastered':
                  return {
                    borderColor: 'border-green-500',
                    bgGradient: 'from-green-500/20 to-emerald-500/20',
                    textColor: 'text-green-400',
                    icon: CheckCircle,
                    iconColor: 'text-green-400'
                  };
                case 'unlocked':
                  return {
                    borderColor: 'border-indigo-500',
                    bgGradient: 'from-indigo-500/20 to-purple-500/20',
                    textColor: 'text-indigo-400',
                    icon: Target,
                    iconColor: 'text-indigo-400'
                  };
                case 'locked':
                default:
                  return {
                    borderColor: 'border-gray-600',
                    bgGradient: 'from-gray-600/10 to-gray-700/10',
                    textColor: 'text-gray-500',
                    icon: Lock,
                    iconColor: 'text-gray-500'
                  };
              }
            };

            const styles = getStateStyles();
            const StateIcon = styles.icon;

            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`relative group ${skillState === 'locked' ? 'cursor-help' : 'cursor-pointer'}`}
                onClick={() => handleSkillClick(skill.id)}
                whileHover={{ 
                  scale: skillState !== 'locked' ? 1.02 : 1,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ 
                  scale: skillState !== 'locked' ? 0.98 : 1,
                  transition: { duration: 0.1 }
                }}
              >
                {/* Hover glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${styles.bgGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Subtle glow for unlocked skills */}
                {skillState === 'unlocked' && progress && progress.challengesCompleted === 0 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Progress glow for skills in progress */}
                {skillState === 'unlocked' && progress && progress.challengesCompleted > 0 && !progress.masteryAchieved && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Success glow for mastered skills */}
                {skillState === 'mastered' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {/* Unlock animation overlay */}
                {skillState === 'unlocked' && progress && progress.challengesCompleted === 0 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-2xl"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.1, 1],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 8,
                      ease: "easeOut"
                    }}
                  />
                )}
                
                <div className={`relative bg-gray-800 rounded-2xl p-4 md:p-6 border ${styles.borderColor} transition-all duration-300 ${skillState === 'locked' ? 'opacity-60' : ''} overflow-hidden`}>
                  
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-gray-700">
                    <motion.div
                      className={`h-full ${skillState === 'mastered' ? 'bg-green-500' : skillState === 'unlocked' ? 'bg-indigo-500' : 'bg-gray-600'}`}
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: skillState === 'mastered' ? '100%' : 
                               progress ? `${progress.progressPercentage}%` : '0%'
                      }}
                      transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    />
                  </div>

                  {/* State Icon */}
                  <div className="absolute top-3 right-3">
                    <motion.div
                      animate={skillState === 'mastered' ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: skillState === 'mastered' ? Infinity : 0,
                        repeatDelay: 3
                      }}
                    >
                      <StateIcon className={`w-5 h-5 ${styles.iconColor}`} />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="mt-2">
                    <div className="flex items-start justify-between mb-3 pr-8">
                      <h3 className={`text-lg md:text-xl font-bold ${skillState === 'locked' ? 'text-gray-400' : 'text-white'} group-hover:${styles.textColor} transition-colors`}>
                        {skill.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        <span>{skill.estimatedMinutes}m</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {skill.description}
                    </p>

                    {/* Progress Information */}
                    {progress && skillState !== 'locked' && (
                      <div className="mb-3 p-2 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300">
                            Progress: {progress.challengesCompleted}/{progress.challengesRequired}
                          </span>
                          <span className={`font-bold ${styles.textColor}`}>
                            {Math.round(progress.progressPercentage)}%
                          </span>
                        </div>
                        
                        {/* Mini progress bar */}
                        <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                          <motion.div
                            className={`h-1.5 rounded-full ${
                              skillState === 'mastered' ? 'bg-green-500' : 'bg-indigo-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.progressPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          {progress.successRate > 0 && (
                            <span className="text-yellow-400">
                              {Math.round(progress.successRate * 100)}% success
                            </span>
                          )}
                          {progress.totalAttempts > 0 && (
                            <span className="text-gray-400">
                              {progress.totalAttempts} attempt{progress.totalAttempts !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Performance trend indicator */}
                        {progress.recentPerformance && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                              progress.recentPerformance.trend === 'improving' ? 'bg-green-400' :
                              progress.recentPerformance.trend === 'declining' ? 'bg-red-400' : 'bg-yellow-400'
                            }`} />
                            <span className="text-xs text-gray-400">
                              {progress.recentPerformance.trend === 'improving' ? 'Improving' :
                               progress.recentPerformance.trend === 'declining' ? 'Needs focus' : 'Steady'}
                            </span>
                            {progress.recentPerformance.streakLength > 1 && (
                              <span className="text-xs text-gray-500">
                                • {progress.recentPerformance.streakLength} streak
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Prerequisites warning for locked skills */}
                    {skillState === 'locked' && unmetPrereqs.length > 0 && (
                      <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-orange-400">
                          <AlertCircle className="w-3 h-3" />
                          <span>Complete {unmetPrereqs.length} prerequisite{unmetPrereqs.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase font-bold">
                        {skill.level || 'Beginner'}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {progress?.xpEarned || 0}/{skill.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
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

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ zIndex: 1000 - index }}
              className={`bg-gray-800 border rounded-lg p-4 shadow-2xl max-w-sm backdrop-blur-sm ${
                notification.type === 'unlock' ? 'border-indigo-500 bg-indigo-500/10' :
                notification.type === 'mastery' ? 'border-green-500 bg-green-500/10' : 
                'border-yellow-500 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'unlock' ? 'bg-indigo-500' :
                    notification.type === 'mastery' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                >
                  {notification.type === 'unlock' && <Target className="w-4 h-4 text-white" />}
                  {notification.type === 'mastery' && <CheckCircle className="w-4 h-4 text-white" />}
                  {notification.type === 'xp' && <Trophy className="w-4 h-4 text-white" />}
                </motion.div>
                <div className="flex-1">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white text-sm font-medium"
                  >
                    {notification.message}
                  </motion.p>
                  {notification.type === 'unlock' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-gray-300 mt-1"
                    >
                      Click to start practicing!
                    </motion.p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              {/* Progress bar for auto-dismiss */}
              <motion.div
                className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div
                  className={`h-full ${
                    notification.type === 'unlock' ? 'bg-indigo-500' :
                    notification.type === 'mastery' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Prerequisites Modal */}
      <AnimatePresence>
        {showPrerequisites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrerequisites(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full shadow-2xl"
            >
              {(() => {
                const skill = graph.nodes.find(n => n.id === showPrerequisites);
                const unmetPrereqs = skill ? getUnmetPrerequisites(skill) : [];
                
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Skill Locked</h3>
                        <p className="text-sm text-gray-400">{skill?.title}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-300 text-sm mb-2">
                        Complete these prerequisites to unlock this skill:
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Info className="w-3 h-3" />
                        <span>{unmetPrereqs.length} of {skill?.prerequisites?.length || 0} remaining</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {unmetPrereqs.map((prereq, index) => {
                        const prereqState = getSkillState(prereq.id);
                        const prereqProgress = getSkillProgress(prereq.id);
                        
                        return (
                          <motion.div
                            key={prereq.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors group"
                            onClick={() => {
                              setShowPrerequisites(null);
                              handleSkillClick(prereq.id);
                            }}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${
                              prereqState === 'mastered' ? 'bg-green-500' :
                              prereqState === 'unlocked' ? 'bg-indigo-500' : 'bg-gray-600'
                            }`}>
                              {prereqState === 'mastered' ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : prereqState === 'unlocked' ? (
                                <Target className="w-4 h-4 text-white" />
                              ) : (
                                <Lock className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium group-hover:text-indigo-300 transition-colors">
                                {prereq.title}
                              </p>
                              {prereqProgress && (
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-gray-400">
                                    {prereqProgress.challengesCompleted}/{prereqProgress.challengesRequired} challenges
                                  </p>
                                  {prereqProgress.progressPercentage > 0 && (
                                    <div className="flex-1 max-w-16 bg-gray-600 rounded-full h-1">
                                      <div 
                                        className={`h-1 rounded-full ${
                                          prereqState === 'mastered' ? 'bg-green-500' : 'bg-indigo-500'
                                        }`}
                                        style={{ width: `${prereqProgress.progressPercentage}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end text-xs text-gray-400">
                              <span>{prereq.estimatedMinutes}m</span>
                              {prereqState === 'unlocked' && (
                                <span className="text-indigo-400 font-medium">Available</span>
                              )}
                              {prereqState === 'mastered' && (
                                <span className="text-green-400 font-medium">Complete</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPrerequisites(null)}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Close
                      </button>
                      {unmetPrereqs.length > 0 && (
                        <button
                          onClick={() => {
                            setShowPrerequisites(null);
                            // Navigate to first unmet prerequisite
                            handleSkillClick(unmetPrereqs[0].id);
                          }}
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                        >
                          Start First
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
            onClick={handleCloseEngine}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-7xl h-[95vh] md:h-[90vh] bg-[#18181b] rounded-xl md:rounded-2xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="h-14 md:h-16 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-base md:text-lg font-semibold text-white truncate">{selectedSkill.title}</h3>
                  <p className="text-xs md:text-sm text-zinc-400 truncate">{selectedSkill.description}</p>
                </div>
                <button
                  onClick={handleCloseEngine}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {renderEngine()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}