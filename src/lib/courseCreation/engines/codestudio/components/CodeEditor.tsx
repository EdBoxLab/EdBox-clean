import React, { useEffect, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  highlightedLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, highlightedLine }) => {
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted line
  useEffect(() => {
    if (highlightedLine && lineRefs.current[highlightedLine]) {
      lineRefs.current[highlightedLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedLine]);

  const lines = code.split('\n');

  return (
    <div className="relative w-full h-full bg-slate-900 font-mono text-sm group overflow-hidden flex flex-col">
      {/* Language Badge */}
      <div className="absolute top-2 right-4 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800 pointer-events-none uppercase z-20">
        {language}
      </div>

      <div className="flex-1 relative flex overflow-hidden" ref={containerRef}>
        {/* Line Gutter */}
        <div className="w-12 bg-slate-950 text-slate-600 text-right pr-2 pt-4 select-none border-r border-slate-800 z-10 shrink-0 overflow-hidden">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isHighlighted = highlightedLine === lineNum;
            return (
              <div 
                key={i} 
                ref={el => { lineRefs.current[lineNum] = el; }}
                className={`h-6 leading-6 text-xs transition-colors duration-200 flex items-center justify-end ${isHighlighted ? 'text-yellow-400 font-bold' : ''}`}
              >
                {lineNum}
                {isHighlighted && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-1 animate-pulse" />}
              </div>
            );
          })}
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative overflow-auto">
          {/* Highlight Overlay */}
          {highlightedLine && (
            <div 
              className="absolute left-0 right-0 h-6 bg-yellow-500/20 pointer-events-none border-l-2 border-yellow-500 z-0"
              style={{ top: `${(highlightedLine - 1) * 24 + 16}px` }} // 16px top padding, 24px line height
            />
          )}

          {/* Text Area */}
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full pl-4 pr-4 pt-4 bg-transparent text-blue-100 outline-none resize-none leading-6 selection:bg-blue-500/30 relative z-10 font-mono"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            style={{ lineHeight: '24px', whiteSpace: 'pre' }} 
          />
        </div>
      </div>
    </div>
  );
};