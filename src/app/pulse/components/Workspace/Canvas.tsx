
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{ width: widthPercent }}
      className="h-full flex flex-col border-r border-white/5 last:border-0 relative bg-slate-900/80 backdrop-blur-md transition-[width] duration-75 ease-linear overflow-hidden shadow-2xl"
    >
      <div className="h-9 flex items-center justify-between px-4 bg-white/5 border-b border-white/10 select-none shrink-0 group">
        <span className="text-xs font-semibold text-cyan-200/80 uppercase tracking-wider truncate flex-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"></div>
          {window.title}
        </span>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"
            >
              {/* Glowing orb */}
              <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping opacity-20" />
                <Sparkles size={48} className="text-cyan-400" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Welcome to Pulse</h1>
              <p className="text-slate-400 mb-8 max-w-md text-center text-lg leading-relaxed">
                Your immersive AI-powered learning environment.
              </p>

              {/* Primary CTA */}
              <button
                onClick={() => setShowSkillPicker(true)}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transition-all overflow-hidden mb-6"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <BookOpen size={22} />
                <span>Start Course with Genie</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Quick-launch tools */}
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-600 mr-1">or open a tool:</p>
                <button
                  onClick={() => onOpenWidget?.(WindowType.CODE_EDITOR)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Code size={12} /> Code Editor
                </button>
                <button
                  onClick={() => onOpenWidget?.(WindowType.BLACKBOARD)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  <Sparkles size={12} /> Blackboard
                </button>
                <button
                  onClick={() => onOpenWidget?.(WindowType.NOTE_WRITER)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-400 hover:text-slate-200 transition-all"
                >
                  <PenLine size={12} /> Notes
                </button>
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





