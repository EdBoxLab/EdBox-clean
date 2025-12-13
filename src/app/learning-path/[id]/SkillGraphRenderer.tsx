'use client';

import React, { useState, useEffect } from 'react';
import { SkillGraph, SkillNode, EngineType, Challenge } from '@/lib/courseCreation/types';
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
  challenges?: Record<string, Challenge>; // optional overrides for custom challenges
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
    switch (currentChallenge.engine) {
      case EngineType.Coding:
        return <CodeStudio challenge={currentChallenge} />;
      case EngineType.Default:
        return <WriteLab challenge={currentChallenge} />;
      case EngineType.Math:
        return <MathLab challenge={currentChallenge} />;
      case EngineType.Language:
        return <LinguaLab challenge={currentChallenge} />;
      default:
        return <div className="text-white">Engine not available</div>;
    }
  };

  // Aggregate totals
  const totalMinutes = graph.nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);
  const totalXP = graph.nodes.reduce((sum, n) => sum + (n.xpReward || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

        {/* Skill Graph Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 md:mb-12 relative"
        >
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-12">
            {/* Morphing Gradient */}
            <motion.div
              className="absolute inset-0"
              animate={{ background: [randomGradient(), randomGradient(), randomGradient()] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '400% 400%' }}
            />
            {/* Warping Blobs */}
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(255,0,255,0.7) 0%, transparent 70%)', left: mousePosition.x * 0.05, top: mousePosition.y * 0.05 }}
              animate={{ scale: [1, 1.2, 0.8, 1], x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(0,255,255,0.7) 0%, transparent 70%)', right: mousePosition.x * 0.03, bottom: mousePosition.y * 0.03 }}
              animate={{ scale: [1, 0.8, 1.3, 1], x: [0, -40, 40, 0], y: [0, 40, -40, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl font-black mb-2">{graph.goal}</h1>
              <p className="text-white/80 mb-4">Master skills by doing, not just watching. Click any skill below to start.</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4">
                {[{ icon: Target, label: `${graph.nodes.length} Skills`, color: '#00ffff' },
                  { icon: Clock, label: `${totalMinutes} min`, color: '#ff00ff' },
                  { icon: Trophy, label: `${totalXP} XP`, color: '#ffff00' }].map((stat, i) => (
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

        {/* Skill Graph Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {graph.nodes.map((skill) => (
            <motion.div
              key={skill.id}
              className="bg-gray-800 p-4 md:p-6 rounded-2xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleSkillClick(skill.id)}
            >
              <h3 className="text-lg md:text-xl font-bold">{skill.title}</h3>
              <p className="text-gray-400 text-sm">{skill.description}</p>
              <div className="mt-2 h-2 rounded-full" style={{ background: randomGradient() }} />
            </motion.div>
          ))}
        </div>

      </div>

      {/* Engine Modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseEngine}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSkill.title}</h3>
                  <p className="text-sm text-zinc-400">{selectedSkill.description}</p>
                </div>
                <button onClick={handleCloseEngine} className="p-2 text-zinc-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{renderEngine()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
