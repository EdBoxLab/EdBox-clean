'use client';
import React from 'react';

export const OutputPreview: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center p-2">
        <div className="text-slate-700 dark:text-slate-300 px-3 py-1 text-sm">
          Output Preview
        </div>
      </div>
      <div className="flex-1 bg-white flex items-center justify-center">
        <p className="text-slate-500">Run the code to see the output here.</p>
      </div>
    </div>
  );
};