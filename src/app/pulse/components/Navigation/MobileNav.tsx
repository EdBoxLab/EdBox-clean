'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, MessageSquare, Zap } from 'lucide-react';
import { GenieIcon } from '@/components/GenieIcon';

interface MobileNavProps {
  activeTab: 'genie' | 'workspace';
  onTabChange: (tab: 'genie' | 'workspace') => void;
  isVisible: boolean;
}

const MotionDiv = motion.div as any;

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] md:hidden"
        >
          {/* Floating Island Container */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-3xl p-1.5 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <NavButton 
              active={activeTab === 'genie'} 
              onClick={() => onTabChange('genie')}
              icon={<MessageSquare size={18} />}
              label="Genie"
            />
            <div className="w-px h-6 bg-white/5 mx-1" />
            <NavButton 
              active={activeTab === 'workspace'} 
              onClick={() => onTabChange('workspace')}
              icon={<Layout size={18} />}
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
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 ${
      active 
        ? 'bg-white/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
        : 'text-slate-400 hover:text-white'
    }`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
