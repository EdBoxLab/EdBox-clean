import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-sm border-t border-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Terminal Output
        </span>
        <button 
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Ready for input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`flex gap-3 ${
            log.type === 'error' ? 'text-red-400' :
            log.type === 'warn' ? 'text-yellow-400' :
            log.type === 'system' ? 'text-blue-400' :
            'text-slate-300'
          }`}>
            <span className="text-slate-600 shrink-0 select-none">
              [{log.timestamp.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]
            </span>
            <span className="break-all whitespace-pre-wrap font-medium">{log.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};