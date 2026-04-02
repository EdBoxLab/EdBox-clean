'use client';

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
          {/* Backdrop Blur - Only show if not pinned or on mobile */}
          <MDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-500 ${
              isPinned ? 'md:hidden' : 'block'
            }`}
          />

          {/* Chat Container */}
          <div 
            className={`fixed inset-0 flex z-[120] pointer-events-none transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
              isPinned ? 'justify-end md:justify-end' : 'items-end md:items-center justify-center p-0 md:p-8'
            }`}
          >
            <MDiv
              layout
              initial={isPinned ? { x: 450, opacity: 1 } : { y: 600, opacity: 0, scale: 0.95 }}
              animate={isPinned ? { x: 0, opacity: 1, y: 0, scale: 1 } : { y: 0, opacity: 1, scale: 1 }}
              exit={isPinned ? { x: 450, opacity: 0 } : { y: 600, opacity: 0, scale: 0.95 }}
              drag={!isPinned ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_: any, info: PanInfo) => {
                 if (info.offset.y > 150) onClose();
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
              className={`bg-slate-900/80 backdrop-blur-[40px] border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto relative ${
                isPinned 
                  ? 'w-full md:w-[450px] h-full md:border-l' 
                  : 'w-full h-[92vh] md:h-[85vh] md:max-w-3xl md:rounded-[40px] rounded-t-[40px] border-t md:border'
              }`}
            >
              
              {/* Mobile Drawer Handle */}
              {!isPinned && (
                <div className="w-full flex justify-center pt-4 pb-1 md:hidden">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
              )}

              {/* Close Button Inside Modal - Desktop only when not pinned */}
              <button 
                onClick={onClose}
                className={`absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-[150] border border-white/5 ${
                   isPinned ? 'hidden' : 'block md:hidden'
                }`}
              >
                <X size={20} />
              </button>


              {/* Chat Content */}
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </MDiv>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const MDiv = motion.div as any;

