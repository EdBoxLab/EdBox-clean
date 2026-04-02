'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MotionDiv = motion.div as any;

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  children
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110]"
          />

          {/* Centralized Chat Container */}
          <div className="fixed inset-0 flex items-center justify-center p-0 md:p-8 z-[120] pointer-events-none">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full h-full md:h-[80vh] md:max-w-2xl bg-slate-900/90 backdrop-blur-3xl md:rounded-3xl border-t md:border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto relative"
            >
              {/* Close Button Inside Modal */}
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-[150] shadow-lg border border-white/5"
              >
                <X size={22} />
              </button>


              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </MotionDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
