import React from 'react';
import { Play, Pause, Square, FastForward, Rewind } from 'lucide-react';
import { SimulationStatus } from '../types';

interface TimelineProps {
  status: SimulationStatus;
  onPlayPause: () => void;
  onStop: () => void;
  time: number;
  speedMultiplier: number;
  onSpeedChange: (mul: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  status, 
  onPlayPause, 
  onStop, 
  time,
  speedMultiplier,
  onSpeedChange 
}) => {
  
  // Format seconds to MM:SS:ms
  const formatTime = (t: number) => {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    const ms = Math.floor((t * 100) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-16 bg-slate-950 border-t border-slate-800 flex items-center px-4 lg:px-8 justify-between z-20 relative">
      
      {/* Transport Controls */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={onStop}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-full transition-all"
          title="Stop & Reset Time"
        >
          <Square size={16} fill="currentColor" />
        </button>
        
        <button 
          onClick={onPlayPause}
          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/20 transition-all mx-2 active:scale-95"
        >
          {status === SimulationStatus.RUNNING ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>

      {/* Timeline Scrubber (Mock) */}
      <div className="flex-1 mx-8 hidden md:flex flex-col justify-center group">
         <div className="flex justify-between text-xs text-slate-500 font-mono mb-2">
            <span>{formatTime(time)}</span>
            <span>Simulation Time</span>
         </div>
         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
            {/* Infinite progress bar look since simulation is unbounded */}
             <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-500 opacity-50"
              style={{ width: '100%' }}
             />
             <div 
               className={`absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 ${status === SimulationStatus.RUNNING ? 'animate-shimmer' : ''}`} 
             />
         </div>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center space-x-4 border-l border-slate-800 pl-4">
        <span className="text-xs font-bold text-slate-500 uppercase">Speed</span>
        <div className="flex bg-slate-900 rounded-lg p-1">
          {[0.5, 1.0, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => onSpeedChange(rate)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${speedMultiplier === rate ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
      
      {/* Styling for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
