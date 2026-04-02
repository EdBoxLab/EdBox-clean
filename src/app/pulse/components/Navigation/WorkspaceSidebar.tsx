'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Layout, 
  Code, 
  BookOpen, 
  PenLine, 
  Zap, 
  ChevronRight, 
  Sparkles,
  Layers,
  Cpu,
  Calculator,
  FlaskConical,
  Palette
} from 'lucide-react';
import { WindowType } from '../../types';

interface WorkspaceSidebarProps {
  onOpenWidget: (type: WindowType, data?: any) => void;
  activeWindows: { id: string, title: string, type: WindowType }[];
  onFocusWindow: (id: string) => void;
  isOpen: boolean;
  onToggle: (val: boolean) => void;
}

const CATEGORIES = [
  {
    id: 'core',
    label: 'Core Tools',
    icon: <Zap size={18} />,
    color: 'text-cyan-400',
    widgets: [
      { type: WindowType.SMART_BOARD, label: 'Smart Blackboard', icon: <Palette size={16} /> },
      { type: WindowType.CODE_EDITOR, label: 'Code Lab', icon: <Code size={16} /> },
      { type: WindowType.NOTE_WRITER, label: 'Note Writer', icon: <PenLine size={16} /> },
      { type: WindowType.NEURON_VISUALIZER, label: 'Neuron Map', icon: <Cpu size={16} /> },
    ]
  },
  {
    id: 'stem',
    label: 'STEM Labs',
    icon: <FlaskConical size={18} />,
    color: 'text-purple-400',
    widgets: [
      { type: WindowType.STEM_PERIODIC_TABLE, label: 'Periodic Table', icon: <Layers size={14} /> },
      { type: WindowType.STEM_MOLECULE, label: '3D Molecules', icon: <Layers size={14} /> },
      { type: WindowType.STEM_CIRCUIT, label: 'Circuit Sim', icon: <Layers size={14} /> },
      { type: WindowType.STEM_SOLAR, label: 'Solar System', icon: <Layers size={14} /> },
    ]
  },
  {
    id: 'math',
    label: 'Mathematics',
    icon: <Calculator size={18} />,
    color: 'text-emerald-400',
    widgets: [
      { type: WindowType.MATH_GRAPHING_CALC, label: 'Graphing Calc', icon: <Layers size={14} /> },
      { type: WindowType.MATH_GEOMETRY, label: 'Geometry Engine', icon: <Layers size={14} /> },
      { type: WindowType.MATH_FRACTAL, label: 'Fractal Explorer', icon: <Layers size={14} /> },
    ]
  }
];

const MotionDiv = motion.div as any;

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ 
  onOpenWidget, 
  activeWindows, 
  onFocusWindow,
  isOpen,
  onToggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<string[]>(['core']);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <MotionDiv
          key="sidebar-open"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-72 h-full bg-slate-900/60 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-6 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Layers size={18} className="text-white" />
                </div>
                <h2 className="text-sm font-bold tracking-tight text-white uppercase italic">
                  Workspace
                </h2>
              </div>
              <button 
                onClick={() => onToggle(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <ChevronRight className="rotate-180" size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all hover:bg-white/10"
              />
            </div>
          </div>

          {/* Scroller Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-white/5 space-y-8">
            
            {/* Active Section */}
            {activeWindows.length > 0 && (
              <div>
                <h3 className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                  In Use
                </h3>
                <div className="space-y-1">
                  {activeWindows.map(win => (
                    <button
                      key={win.id}
                      onClick={() => onFocusWindow(win.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-100 text-xs text-left hover:bg-cyan-500/20 transition-all group"
                    >
                      <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                      <span className="truncate flex-1">{win.title}</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {CATEGORIES.map(cat => (
              <div key={cat.id}>
                <button 
                  onClick={() => toggleCat(cat.id)}
                  className="w-full flex items-center justify-between px-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 hover:text-slate-300 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className={cat.color}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  <ChevronRight size={12} className={`transition-transform duration-300 ${expandedCats.includes(cat.id) ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {expandedCats.includes(cat.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      {cat.widgets.map(w => (
                        <button
                          key={w.type}
                          onClick={() => onOpenWidget(w.type)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 text-slate-400 hover:text-white text-xs text-left transition-all group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all">
                            {w.icon}
                          </div>
                          <span className="truncate">{w.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Footer Promo/Status */}
          <div className="p-4 border-t border-white/5 bg-slate-900/40">
             <div className="bg-white/5 rounded-2xl p-4 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pulse Status</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                   Syncing workspace with <span className="text-cyan-400 font-bold">Genie OS</span>. Context depth: High.
                </p>
             </div>
          </div>
        </MotionDiv>
      ) : (
        <MotionDiv
          key="sidebar-closed"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3"
        >
          <button 
            onClick={() => onToggle(true)}
            className="group w-12 h-12 rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-all shadow-2xl"
            title="Open Workspace"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          
          <div className="w-12 h-px bg-white/5" />
          
          <button 
            onClick={() => onOpenWidget(WindowType.SMART_BOARD)}
            className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/20 transition-all shadow-xl"
            title="Quick Blackboard"
          >
            <Palette size={18} />
          </button>
          
          <button 
            onClick={() => onOpenWidget(WindowType.CODE_EDITOR)}
            className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/20 transition-all shadow-xl"
            title="Quick Code"
          >
            <Code size={18} />
          </button>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};
