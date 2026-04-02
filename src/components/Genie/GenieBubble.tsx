'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Orb from './Orb';
import { GenieState } from '@/app/pulse/types';

interface GenieBubbleProps {
  genieState: GenieState;
  isLiveActive: boolean;
  isLivePaused?: boolean;
  onClick: () => void;
  isOpen: boolean;
}

const MotionDiv = motion.div as any;

export const GenieBubble: React.FC<GenieBubbleProps> = ({
  genieState,
  isLiveActive,
  isLivePaused,
  onClick,
  isOpen
}) => {
  const orbState = isLiveActive && !isLivePaused 
    ? 'speaking' 
    : (genieState.isThinking ? 'focused' : 'neutral');

  return (
    <MotionDiv
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isOpen ? 0.8 : 1, 
        opacity: 1,
        y: [0, -4, 0]
      }}
      transition={{
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        scale: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileHover={{ scale: 1.1, y: -8 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-8 right-8 z-[100] cursor-pointer group"
    >
      {/* Halo Effect */}
      <MotionDiv
        className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Main Bubble Container */}
      <div className="relative w-16 h-16 bg-slate-900/40 backdrop-blur-xl rounded-full border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-all group-hover:border-cyan-500/50">
        <Orb state={orbState} size="md" />
        
        {/* Status indicator for live mode */}
        {isLiveActive && (
          <div className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </div>
        )}
      </div>

      {/* Tooltip / Label */}
      {!isOpen && (
        <MotionDiv
          initial={{ opacity: 0, x: 20 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute right-20 top-1/2 -translate-y-1/2 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl whitespace-nowrap text-sm font-medium text-white shadow-xl pointer-events-none"
        >
          Ask Genie Chat
        </MotionDiv>
      )}
    </MotionDiv>
  );
};
