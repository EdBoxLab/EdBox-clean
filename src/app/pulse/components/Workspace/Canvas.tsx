
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PulseWindow, WindowType } from '../../types';
import { X, Minus } from 'lucide-react';
import NeuronVisualizer from '../Widgets/NeuronVisualizer';
import CodeEditor from '../Widgets/CodeEditor';
import SmartBoard from '../Widgets/SmartBoard';
import PulseStudyKit from '../Widgets/PulseStudyKit';
import NoteWriter from '../Widgets/NoteWriter';
import UniversalWidget from '../Widgets/UniversalWidget';
import DynamicWidget from '../Widgets/DynamicWidget';

interface CanvasProps {
  windows: PulseWindow[];
  setWindows: React.Dispatch<React.SetStateAction<PulseWindow[]>>;
  onRunCode?: (code: string, language: string, widgetId: string) => void;
  onMinimize: (id: string) => void;
}

const MotionDiv = motion.div as any;

const Canvas: React.FC<CanvasProps> = ({ windows, setWindows, onRunCode, onMinimize }) => {
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

  // Filter out minimized windows for the workspace view
  const activeWindows = windows.filter(w => !w.isMinimized);

  // On mobile, show max 1. On desktop, max 2.
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
    // Generic update handler for any widget
    const onUpdate = (newData: any) => handleUpdateWindowData(window.id, newData);

    switch (window.type) {
      case WindowType.CUSTOM_GENERATED:
        return <DynamicWidget code={window.data?.code || ''} data={window.data} onUpdate={onUpdate} />;
      case WindowType.NEURON_VISUALIZER:
        return <NeuronVisualizer data={window.data} onUpdate={onUpdate} />;
      case WindowType.CODE_EDITOR:
        // Backwards compatibility for single-code string data
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
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-4 bg-white/5 border-b border-white/10 select-none shrink-0 group">
        <span className="text-xs font-semibold text-cyan-200/80 uppercase tracking-wider truncate flex-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"></div>
          {window.title}
        </span>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderWidgetContent(window)}
      </div>
    </MotionDiv>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex flex-col">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Workspace Container */}
      <div ref={containerRef} className="flex-1 flex relative z-10 w-full h-full">
        <AnimatePresence mode='popLayout'>
          {visibleWindows.length === 0 && (
            <MotionDiv
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-600 font-mono text-sm"
            >
              <span className="animate-pulse">Waiting for widget deployment...</span>
            </MotionDiv>
          )}

          {visibleWindows.length === 1 && renderPane(visibleWindows[0], '100%')}

          {visibleWindows.length === 2 && (
            <>
              {renderPane(visibleWindows[0], `${splitRatio * 100}%`)}

              {/* Resizer Handle */}
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
    </div>
  );
};

export default Canvas;
