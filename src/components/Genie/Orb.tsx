import React from 'react';
import { motion } from 'framer-motion';

interface OrbProps {
  state: 'neutral' | 'focused' | 'serene' | 'excited' | 'speaking' | 'idle';
  size?: 'sm' | 'md' | 'lg';
}

const MotionDiv = motion.div as any;

const Orb: React.FC<OrbProps> = ({ state, size = 'md' }) => {
  const isActive = state !== 'neutral' && state !== 'idle';
  
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]}`}>
      {/* Dynamic Glow Layer */}
      <MotionDiv
        className="absolute inset-0 rounded-full blur-xl"
        animate={isActive ? { 
          opacity: [0.3, 0.6, 0.3], 
          scale: [1, 1.2, 1],
          backgroundColor: state === 'speaking' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.2)'
        } : { 
          opacity: 0.1,
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Core Sphere */}
      <MotionDiv
        className="w-full h-full rounded-full bg-white shadow-2xl relative overflow-hidden ring-1 ring-white/20"
        style={{
            background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f1f5f9 45%, #e2e8f0 100%)'
        }}
        animate={state === 'speaking' ? {
          scale: [1, 1.08, 1],
        } : state === 'focused' ? {
          scale: [1, 0.96, 1],
          opacity: [1, 0.85, 1]
        } : state === 'excited' ? {
          scale: [1, 1.15, 1],
          filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"]
        } : state === 'serene' ? {
          opacity: [1, 0.7, 1],
          scale: [1, 1.03, 1]
        } : {
          scale: 1,
          opacity: 1
        }}
        transition={state === 'speaking' || state === 'excited' ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Iridescent shimmer effect */}
        <MotionDiv 
          className="absolute inset-0 opacity-20 bg-gradient-to-tr from-cyan-400 via-transparent to-purple-500"
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </MotionDiv>
    </div>
  );
};

export default Orb;
