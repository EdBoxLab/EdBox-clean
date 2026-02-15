import React from 'react';
import { motion } from 'framer-motion';

interface OrbProps {
  state: 'neutral' | 'thinking' | 'speaking';
}

const MotionDiv = motion.div as any;

const Orb: React.FC<OrbProps> = ({ state }) => {
  const isActive = state !== 'neutral';

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      {/* Subtle Glow for active state */}
      <MotionDiv
        className="absolute inset-0 rounded-full bg-white/20 blur-md"
        animate={isActive ? { opacity: [0, 0.5, 0], scale: [1, 1.2, 1] } : { opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Core Sphere - ChatGPT Style (Clean Circle) */}
      <MotionDiv
        className="w-full h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)] relative overflow-hidden"
        animate={state === 'speaking' ? {
            scale: [1, 1.15, 1],
        } : state === 'thinking' ? {
            scale: [1, 0.95, 1],
            opacity: [1, 0.7, 1]
        } : {
            scale: 1,
            opacity: 1
        }}
        transition={state === 'speaking' ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" } : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
          {/* Subtle gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-100 to-slate-300" />
      </MotionDiv>
    </div>
  );
};

export default Orb;