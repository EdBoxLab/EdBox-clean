import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Maximize2, GripHorizontal } from 'lucide-react';
import { PulseWindow } from '../../types';

interface WindowFrameProps {
  window: PulseWindow;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

const WindowFrame: React.FC<WindowFrameProps> = ({ window, onClose, onFocus, children }) => {
  const constraintsRef = useRef(null);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => onFocus(window.id)}
      onMouseDown={() => onFocus(window.id)}
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0 }}
      style={{ 
          position: 'absolute', 
          width: window.width, 
          height: window.height,
          zIndex: window.zIndex,
          left: window.x,
          top: window.y
      }}
      className="flex flex-col rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-slate-900/80 border border-white/10 ring-1 ring-white/5"
    >
      {/* Window Header */}
      <div 
        className="h-10 bg-gradient-to-r from-white/5 to-transparent flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-white/5"
      >
        <div className="flex items-center space-x-2 text-slate-400">
           <GripHorizontal size={14} />
           <span className="text-xs font-medium text-slate-300 tracking-wide select-none">{window.title}</span>
        </div>
        <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <Minus size={12} />
            </button>
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <Maximize2 size={12} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(window.id); }}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors text-slate-400 hover:text-red-400"
            >
                <X size={12} />
            </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative bg-black/20">
        {children}
      </div>
    </motion.div>
  );
};

export default WindowFrame;