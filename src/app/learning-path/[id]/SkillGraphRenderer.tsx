'use client';

import React, { useState, useEffect } from 'react';
import { SkillGraph, SkillNode, Challenge } from '@/lib/courseCreation/types';
import { EngineType } from '@/app/api/learning-path/generate/types/enums';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { X, Sparkles, Trophy, Clock, Target, Zap } from 'lucide-react';

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

  // Track mouse for background animations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle skill click
  const handleSkillClick = (skillId: string) => {
    const skill = graph.nodes.find((n) => n.id === skillId) || null;
    if (!skill) return;

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
  };

  const handleCloseEngine = () => {
    setSelectedSkill(null);
    setCurrentChallenge(null);
  };

  // Render engine based on type
  const renderEngine = () => {
    if (!currentChallenge) return null;
    console.log('Current challenge engine:', currentChallenge.engine);
    switch (currentChallenge.engine) {
      case EngineType.CodeStudio:
        return <CodeStudio challenge={currentChallenge} />;
      case EngineType.WritingStudio:
        return <WriteLab challenge={currentChallenge} />;
      case EngineType.MathLab:
        return <MathLab challenge={currentChallenge} />;
      case EngineType.LinguaLab:
        return <LinguaLab challenge={currentChallenge} />;
      case EngineType.FinLab:
        return <WriteLab challenge={currentChallenge} />; // Default fallback
      default:
        console.log('No matching engine for:', currentChallenge.engine);
        return <div className="text-white">Engine not available for: {currentChallenge.engine}</div>;
    }
  };

  // Aggregate totals
  const totalMinutes = graph.nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);
  const totalXP = graph.nodes.reduce((sum, n) => sum + (n.xpReward || 0), 0);

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

              {/* Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4">
                {[
                  { icon: Target, label: `${graph.nodes.length} Skills`, color: '#00ffff' },
                  { icon: Clock, label: `${totalMinutes} min`, color: '#ff00ff' },
                  { icon: Trophy, label: `${totalXP} XP`, color: '#ffff00' }
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
            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Learning Path</h2>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
              <Zap className="w-4 h-4" />
              <span>Click any skill to start</span>
            </div>
          </div>
        </motion.div>

        {/* Skill Graph Nodes - THIS WAS MISSING! */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
        >
          {graph.nodes.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="relative group cursor-pointer"
              onClick={() => handleSkillClick(skill.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300 hover:scale-105">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ background: randomGradient() }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                  />
                </div>

                {/* Content */}
                <div className="mt-2">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
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

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase font-bold">
                      {skill.level || 'Beginner'}
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-bold">{skill.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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