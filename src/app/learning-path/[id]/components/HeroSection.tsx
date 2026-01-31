'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, Zap, Trophy, Clock } from 'lucide-react';
import { SkillGraph } from '@/lib/courseCreation/types';
import SkillProgressBar from './SkillProgressBar';

interface HeroSectionProps {
  graph: SkillGraph;
  mousePosition: { x: number; y: number };
  totalMinutes: number;
  totalXP: number;
  earnedXP: number;
  masteredSkills: number;
  unlockedSkills: number;
}

const randomGradient = () =>
  `linear-gradient(135deg, hsl(${Math.random() * 360}, 70%, 50%) 0%, hsl(${Math.random() * 360}, 70%, 60%) 100%)`;

export default function HeroSection({
  graph,
  mousePosition,
  totalMinutes,
  totalXP,
  earnedXP,
  masteredSkills,
  unlockedSkills
}: HeroSectionProps) {
  return (
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
                {graph?.goal || 'Learning Path'}
              </h1>
            </div>
          </div>

          <p className="text-sm md:text-lg text-white/95 mb-4 md:mb-6 max-w-2xl font-medium">
            Master skills through hands-on practice. No passive videos—just real challenges that build your abilities progressively.
          </p>

          {/* Overall Progress Bar */}
          {(graph?.nodes?.length || 0) > 0 && (
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between text-sm text-white/90 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round((masteredSkills / (graph?.nodes?.length || 1)) * 100)}% Complete</span>
              </div>
              <SkillProgressBar
                progress={(masteredSkills / (graph?.nodes?.length || 1)) * 100}
                height="h-2"
                trackColorClass="bg-white/20"
                colorClass="bg-gradient-to-r from-green-400 to-emerald-500"
                delay={1}
                duration={2}
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{masteredSkills} mastered</span>
                <span>{(graph?.nodes?.length || 0) - masteredSkills} remaining</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-2 md:gap-4">
            {[
              { icon: Target, label: `${masteredSkills}/${graph?.nodes?.length || 0} Mastered`, color: '#00ff00' },
              { icon: Zap, label: `${unlockedSkills} Unlocked`, color: '#00ffff' },
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
  );
}