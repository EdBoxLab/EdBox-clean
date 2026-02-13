'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import type { ChapterContent } from '@/types/chapters';

interface ChapterNavigationProps {
  chapters: ChapterContent[];
  activeChapterIndex: number;
  onChapterChange: (index: number) => void;
  completedChapters?: string[];
  compact?: boolean;
}

export function ChapterNavigation({
  chapters,
  activeChapterIndex,
  onChapterChange,
  completedChapters = [],
  compact = false
}: ChapterNavigationProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => onChapterChange(index)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              index === activeChapterIndex
                ? 'bg-indigo-600 text-white'
                : completedChapters.includes(chapter.id)
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onChapterChange(Math.max(0, activeChapterIndex - 1))}
          disabled={activeChapterIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        
        <div className="text-sm text-zinc-500">
          Chapter {activeChapterIndex + 1} of {chapters.length}
        </div>
        
        <button
          onClick={() => onChapterChange(Math.min(chapters.length - 1, activeChapterIndex + 1))}
          disabled={activeChapterIndex === chapters.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {chapters.map((chapter, index) => {
          const isActive = index === activeChapterIndex;
          const isCompleted = completedChapters.includes(chapter.id);
          
          return (
            <button
              key={chapter.id}
              onClick={() => onChapterChange(index)}
              className={`relative flex-shrink-0 group`}
            >
              <motion.div
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : isCompleted
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isActive ? 'bg-white/20' : 'bg-zinc-800'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">
                    {chapter.title.replace(/^(Chapter \d+:?\s*)?/i, '').slice(0, 20)}
                  </span>
                </div>
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="activeChapterIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white mb-1">
              {chapters[activeChapterIndex]?.title}
            </h3>
            <p className="text-sm text-zinc-400 line-clamp-2">
              {chapters[activeChapterIndex]?.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChapterProgressBarProps {
  chapters: ChapterContent[];
  completedChapters: string[];
  className?: string;
}

export function ChapterProgressBar({
  chapters,
  completedChapters,
  className = ''
}: ChapterProgressBarProps) {
  const progress = (completedChapters.length / chapters.length) * 100;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Progress</span>
        <span className="text-white font-medium">
          {completedChapters.length} / {chapters.length} chapters
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
