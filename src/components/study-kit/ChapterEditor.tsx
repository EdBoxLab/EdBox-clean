'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  BookOpen,
  Target,
  Lightbulb,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { DetectedChapter } from '@/types/chapters';

interface ChapterEditorProps {
  chapter: DetectedChapter;
  isOpen: boolean;
  onClose: () => void;
  onSave: (chapter: DetectedChapter) => void;
}

export function ChapterEditor({
  chapter,
  isOpen,
  onClose,
  onSave
}: ChapterEditorProps) {
  const [title, setTitle] = useState(chapter.title);
  const [summary, setSummary] = useState(chapter.summary);
  const [keyTopics, setKeyTopics] = useState(chapter.keyTopics.join(', '));
  const [learningObjectives, setLearningObjectives] = useState(
    chapter.learningObjectives.join('\n')
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!summary.trim()) {
      newErrors.summary = 'Summary is required';
    } else if (summary.length < 20) {
      newErrors.summary = 'Summary should be at least 20 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    onSave({
      ...chapter,
      title: title.trim(),
      summary: summary.trim(),
      keyTopics: keyTopics.split(',').map(t => t.trim()).filter(Boolean),
      learningObjectives: learningObjectives.split('\n').map(o => o.trim()).filter(Boolean)
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Edit Chapter {chapter.chapterNumber}</h2>
                <p className="text-sm text-zinc-400">Modify chapter details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Chapter Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive chapter title"
                className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  errors.title ? 'border-red-500' : 'border-zinc-700'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief summary of what this chapter covers"
                rows={4}
                className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none ${
                  errors.summary ? 'border-red-500' : 'border-zinc-700'
                }`}
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.summary}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {summary.length} characters
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Key Topics
              </label>
              <input
                type="text"
                value={keyTopics}
                onChange={(e) => setKeyTopics(e.target.value)}
                placeholder="topic1, topic2, topic3"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Separate topics with commas
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                Learning Objectives
              </label>
              <textarea
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="What will students learn from this chapter?&#10;One objective per line..."
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
              <p className="mt-1 text-xs text-zinc-500">
                One objective per line
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Chapter Info</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Position:</span>
                  <span className="text-white ml-2">
                    {chapter.startPosition.toLocaleString()} - {chapter.endPosition.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Length:</span>
                  <span className="text-white ml-2">
                    {(chapter.endPosition - chapter.startPosition).toLocaleString()} chars
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Confidence:</span>
                  <span className="text-white ml-2">
                    {Math.round(chapter.confidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Detection:</span>
                  <span className="text-white ml-2 capitalize">
                    {chapter.detectionMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
