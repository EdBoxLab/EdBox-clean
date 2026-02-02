'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GenieIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Gemini-inspired Neural Pulse */}
        <motion.path
          d="M12 2C12 2 13 8 18 10C13 12 12 18 12 18C12 18 11 12 6 10C11 8 12 2 12 2Z"
          fill="url(#genie-gradient)"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
            filter: ["blur(0px)", "blur(1px)", "blur(0px)"]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M12 6C12 6 12.5 9 15 10C12.5 11 12 14 12 14C12 14 11.5 11 9 10C11.5 9 12 6 12 6Z"
          fill="white"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            scale: [0.8, 1, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle Orbitals */}
        <motion.circle
          cx="12"
          cy="10"
          r="8"
          stroke="url(#genie-gradient)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ opacity: 0.3 }}
        />

        <defs>
          <linearGradient id="genie-gradient" x1="6" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" /> {/* Indigo 500 */}
            <stop offset="0.5" stopColor="#A855F7" /> {/* Purple 500 */}
            <stop offset="1" stopColor="#EC4899" /> {/* Pink 500 */}
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
