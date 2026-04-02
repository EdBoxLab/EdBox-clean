'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, MessageSquare, Layers } from 'lucide-react';

interface MobileNavProps {
  activeTab: 'genie' | 'workspace';
  onTabChange: (tab: 'genie' | 'workspace') => void;
  isVisible: boolean;
  onOpenWidgets?: () => void;
}

const MotionDiv = motion.div as any;

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, isVisible, onOpenWidgets }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] md:hidden w-[90%]"
        >
          {/* Floating Island Container */}
          <div className="flex items-center justify-between gap-1 bg-slate-900/60 backdrop-blur-3xl p-2 rounded-[32px] border border-white/5 shadow-[0_25px_50px_rgba(0,0,0,0.6)]">
            <NavButton 
              active={activeTab === 'genie'} 
              onClick={() => onTabChange('genie')}
              icon={<MessageSquare size={20} />}
              label="Genie"
            />
            
            <div className="flex items-center justify-center">
              <button 
                onClick={onOpenWidgets}
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-cyan-400 shadow-black/40 hover:bg-cyan-500/20 hover:border-cyan-500/30"
              >
                <Layers size={22} />
              </button>
            </div>

            <NavButton 
              active={activeTab === 'workspace'} 
              onClick={() => onTabChange('workspace')}
              icon={<Layout size={20} />}
              label="Canvas"
            />
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-6 py-2.5 rounded-[24px] transition-all duration-500 ${
      active 
        ? 'bg-white/5 text-cyan-400' 
        : 'text-slate-500 hover:text-white'
    }`}
  >
    <div className={`transition-all duration-500 ${active ? 'scale-110 translate-y-[-2px]' : 'scale-100'}`}>
      {icon}
    </div>
    <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);