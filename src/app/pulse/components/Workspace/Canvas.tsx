
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PulseWindow, WindowType } from '../../types';
import { X, Minus, Sparkles, ArrowRight, Code, BookOpen, PenLine } from 'lucide-react';
import NeuronVisualizer from '../Widgets/NeuronVisualizer';
import CodeEditor from '../Widgets/CodeEditor';
import SmartBoard from '../Widgets/SmartBoard';
import PulseStudyKit from '../Widgets/PulseStudyKit';
import NoteWriter from '../Widgets/NoteWriter';
import UniversalWidget from '../Widgets/UniversalWidget';
import DynamicWidget from '../Widgets/DynamicWidget';
import SkillGraphWidget from '../Widgets/SkillGraphWidget';
import SkillSessionWidget from '../Widgets/SkillSessionWidget';
import SkillPickerModal from '../Widgets/SkillPickerModal';

interface CanvasProps {
  windows: PulseWindow[];
  setWindows: React.Dispatch<React.SetStateAction<PulseWindow[]>>;
  onRunCode?: (code: string, language: string, widgetId: string) => void;
  onMinimize: (id: string) => void;
  onSendGenieMessage?: (message: string) => void;
  onOpenWidget?: (type: WindowType, data?: any) => void;
}

const MotionDiv = motion.div as any;

const Canvas: React.FC<CanvasProps> = ({ windows, setWindows, onRunCode, onMinimize, onSendGenieMessage, onOpenWidget }) => {
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeWindows = windows.filter(w => !w.isMinimized);
  const visibleWindows = isMobile ? activeWindows.slice(-1) : activeWindows.slice(-2);

  const handleClose = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateWindowData = (id: string, newData: any) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, data: { ...w.data, ...newData } } : w));
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - containerRect.left) / containerRect.width;
      setSplitRatio(Math.min(Math.max(newRatio, 0.2), 0.8));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const renderWidgetContent = (window: PulseWindow) => {
    const onUpdate = (newData: any) => handleUpdateWindowData(window.id, newData);

    switch (window.type) {
      case WindowType.CUSTOM_GENERATED:
        return <DynamicWidget code={window.data?.code || ''} data={window.data} onUpdate={onUpdate} />;
      case WindowType.NEURON_VISUALIZER:
        return <NeuronVisualizer data={window.data} onUpdate={onUpdate} />;
      case WindowType.CODE_EDITOR:
        const files = window.data?.files || (window.data?.code ? [{
          id: 'default',
          name: 'script.js',
          language: 'javascript',
          content: window.data.code
        }] : undefined);

        return (
          <CodeEditor
            files={files}
            activeFileId={window.data?.activeFileId}
            logs={window.data?.logs}
            onUpdate={onUpdate}
            executionTrigger={window.data?.executionTrigger}
            onRun={onRunCode ? (code, lang) => onRunCode(code, lang, window.id) : undefined}
          />
        );
      case WindowType.BLACKBOARD:
      case WindowType.SMART_BOARD:
        return <SmartBoard data={window.data} onUpdate={onUpdate} />;
      case WindowType.STUDY_KIT:
        return <PulseStudyKit window={window} />;
      case WindowType.NOTE_WRITER:
        return (
          <NoteWriter
            initialText={window.data?.text}
            onUpdate={(text) => handleUpdateWindowData(window.id, { text })}
          />
        );
      case WindowType.SKILL_GRAPH:
        return <SkillGraphWidget window={window} />;
      case WindowType.SKILL_SESSION:
        return <SkillSessionWidget window={window} onSendGenieMessage={onSendGenieMessage} />;
      default:
        return <UniversalWidget type={window.type} data={window.data} />;
    }
  };

  const renderPane = (window: PulseWindow, widthPercent: string) => (
    <MotionDiv
      key={window.id}
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ width: widthPercent }}
      className="h-full flex flex-col border-r border-white/5 last:border-0 relative bg-slate-900/40 backdrop-blur-3xl transition-[width] duration-500 cubic-bezier(0.16, 1, 0.3, 1) overflow-hidden shadow-2xl"
    >
      <div className="h-10 flex items-center justify-between px-5 bg-white/5 border-b border-white/5 select-none shrink-0 group">
        <span className="text-[10px] font-black text-cyan-200/60 uppercase tracking-[0.2em] truncate flex-1 flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] group-hover:scale-125 transition-transform"></div>
          {window.title}
        </span>
        <button 
          onClick={() => handleClose(window.id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all md:opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {renderWidgetContent(window)}
      </div>
    </MotionDiv>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div ref={containerRef} className="flex-1 flex relative z-10 w-full h-full">
        <AnimatePresence mode='popLayout'>
          {visibleWindows.length === 0 && (
            <MotionDiv
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 relative"
            >
              {/* Guidance Beam (pointing left towards sidebar on desktop) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-64 bg-cyan-500/5 blur-[100px] rounded-full hidden md:block animate-pulse" />

              {/* Glowing orb */}
              <div className="w-32 h-32 bg-cyan-500/10 rounded-full flex items-center justify-center mb-10 relative">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping opacity-10" />
                <Sparkles size={56} className="text-cyan-400/80" />
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter italic">
                PULSE <span className="text-cyan-500 text-3xl align-top not-italic font-bold">OS</span>
              </h1>
              <p className="text-slate-500 mb-12 max-w-lg text-center text-lg leading-relaxed font-medium">
                Your high-context neural workspace for immersive learning.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col items-center gap-6 w-full max-w-xs md:max-w-none">
                <button
                  onClick={() => setShowSkillPicker(true)}
                  className="group relative flex items-center justify-center gap-4 bg-white text-black w-full md:w-auto px-10 py-5 rounded-full font-black text-lg shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all overflow-hidden"
                >
                  <BookOpen size={22} className="group-hover:rotate-12 transition-transform" />
                  <span>INITIALIZE COURSE</span>
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
                
                <p className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] flex items-center gap-3">
                   <div className="w-4 md:w-8 h-px bg-white/5" />
                   OR OPEN A TOOL IN THE SIDEBAR
                   <div className="w-4 md:w-8 h-px bg-white/5" />
                </p>
              </div>
            </MotionDiv>
          )}

          {visibleWindows.length === 1 && renderPane(visibleWindows[0], '100%')}

          {visibleWindows.length === 2 && (
            <>
              {renderPane(visibleWindows[0], `${splitRatio * 100}%`)}

              <div
                onMouseDown={startResize}
                className="w-1 hover:w-2 bg-black/50 hover:bg-cyan-500/50 cursor-col-resize z-50 transition-all flex items-center justify-center group"
                style={{ marginLeft: '-1px', marginRight: '-1px' }}
              >
                <div className="h-8 w-1 bg-white/20 rounded-full group-hover:bg-white/50" />
              </div>

              {renderPane(visibleWindows[1], `${(1 - splitRatio) * 100}%`)}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Skill Picker Modal */}
      <AnimatePresence>
        {showSkillPicker && (
          <SkillPickerModal
            onClose={() => setShowSkillPicker(false)}
            onOpenWidget={(type, data) => {
              onOpenWidget?.(type, data);
              setShowSkillPicker(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


export default Canvas;





