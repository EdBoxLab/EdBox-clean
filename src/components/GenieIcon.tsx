'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GenieIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Geometric Technical Core (EdBox Motif) */}
        <motion.path
          d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M12 22V12L21 7M12 12L3 7"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-50"
        />
        {/* Pulsing Neural Center */}
        <motion.rect
          x="10" y="10" width="4" height="4" rx="1"
          fill="currentColor"
          className="text-indigo-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        {/* Connection Nodes */}
        <circle cx="12" cy="2" r="1" fill="currentColor" className="text-zinc-500" />
        <circle cx="21" cy="17" r="1" fill="currentColor" className="text-zinc-500" />
        <circle cx="3" cy="17" r="1" fill="currentColor" className="text-zinc-500" />
      </svg>
    </div>
  );
}
