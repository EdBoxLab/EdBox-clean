'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  initialProgress?: number;
}

export interface ProgressBarHandle {
  setProgress: (value: number) => void;
  getProgress: () => number;
}

const ProgressBarComponent = forwardRef<ProgressBarHandle, ProgressBarProps>(
  ({ initialProgress = 0 }, ref) => {
    const progressRef = useRef(initialProgress);
    const displayRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      setProgress: (value: number) => {
        const clampedValue = Math.max(0, Math.min(100, value));
        progressRef.current = clampedValue;
        
        if (displayRef.current) {
          displayRef.current.style.width = `${clampedValue}%`;
        }
        
        if (labelRef.current) {
          labelRef.current.textContent = `${Math.round(clampedValue)}%`;
        }
      },
      getProgress: () => progressRef.current
    }));

    useEffect(() => {
      if (displayRef.current) {
        displayRef.current.style.width = `${progressRef.current}%`;
      }
      if (labelRef.current) {
        labelRef.current.textContent = `${Math.round(progressRef.current)}%`;
      }
    }, []);

    return (
      <div className="flex items-center gap-3">
        <span ref={labelRef} className="text-sm font-semibold text-white">0%</span>
        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            ref={displayRef}
            initial={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>
      </div>
    );
  }
);

ProgressBarComponent.displayName = 'ProgressBar';

export const ProgressBar = memo(ProgressBarComponent);

interface StepProgressProps {
  goals: Array<{
    id: string;
    text: string;
    status: 'pending' | 'in_progress' | 'mastered';
    confidence: number;
  }>;
}

export const StepProgress = ({ goals }: StepProgressProps) => {
  if (!goals || goals.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-4 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-30 overflow-x-auto no-scrollbar shadow-xl">
      <div className="flex-shrink-0 mr-2">
        <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-4 min-w-max pr-6">
        {goals.map((goal, idx) => (
          <React.Fragment key={goal.id}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-500 ${goal.status === 'mastered' ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]' :
                goal.status === 'in_progress' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-pulse shadow-[0_0_12px_rgba(96,165,250,0.4)]' :
                  'bg-gray-800 text-gray-500 border border-gray-700'
                }`}>
                {goal.status === 'mastered' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-semibold uppercase tracking-wider truncate max-w-[80px] ${goal.status === 'mastered' ? 'text-green-400' :
                  goal.status === 'in_progress' ? 'text-blue-400' :
                    'text-gray-500'
                  }`}>
                  {goal.text}
                </span>
                <div className="h-0.5 w-full bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.confidence || 0}%` }}
                    className={`h-full ${goal.status === 'mastered' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                  />
                </div>
              </div>
            </div>
            {idx < goals.length - 1 && (
              <div className={`h-[1px] w-6 flex-shrink-0 ${goals[idx + 1].status !== 'pending' ? 'bg-gradient-to-r from-blue-500/50 to-purple-500/50' : 'bg-gray-800'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
