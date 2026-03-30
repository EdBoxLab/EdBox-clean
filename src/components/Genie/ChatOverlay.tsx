'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isPinned?: boolean;
}

const MotionDiv = motion.div as any;

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  children,
  isPinned = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur - Only show if not pinned */}
          {!isPinned && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110]"
            />
          )}

          {/* Chat Container */}
          <div 
            className={`fixed inset-0 flex z-[120] pointer-events-none transition-all duration-500 ease-in-out ${
              isPinned ? 'justify-end' : 'items-center justify-center p-0 md:p-8'
            }`}
          >
            <MotionDiv
              initial={isPinned ? { x: 450, opacity: 1 } : { opacity: 0, scale: 0.9, y: 100 }}
              animate={isPinned ? { x: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isPinned ? { x: 450, opacity: 0 } : { opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className={`bg-slate-900/90 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto relative transition-all duration-500 ${
                isPinned 
                  ? 'w-full md:w-[450px] h-full border-l' 
                  : 'w-full h-full md:h-[85vh] md:max-w-2xl md:rounded-3xl border-t md:border'
              }`}
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

