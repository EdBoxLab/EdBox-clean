'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  BookOpen,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  Merge,
  Split,
  Plus,
  Check,
  X,
  GripVertical,
  AlertCircle,
  Sparkles,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react';
import type { DetectedChapter, DocumentAnalysis, ChapterRecommendations } from '@/types/chapters';

interface ChapterReviewScreenProps {
  chapters: DetectedChapter[];
  documentAnalysis: DocumentAnalysis;
  recommendations: ChapterRecommendations;
  onConfirm: (chapters: DetectedChapter[]) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function ChapterReviewScreen({
  chapters: initialChapters,
  documentAnalysis,
  recommendations,
  onConfirm,
  onRegenerate,
  isRegenerating = false
}: ChapterReviewScreenProps) {
  const [chapters, setChapters] = useState<DetectedChapter[]>(initialChapters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  const handleEditStart = (chapter: DetectedChapter) => {
    setEditingId(chapter.id);
    setEditTitle(chapter.title);
    setEditSummary(chapter.summary);
  };

  const handleEditSave = () => {
    if (!editingId) return;
    
    setChapters(prev => prev.map(ch => 
      ch.id === editingId 
        ? { ...ch, title: editTitle, summary: editSummary }
        : ch
    ));
    setEditingId(null);
    setEditTitle('');
    setEditSummary('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditSummary('');
  };

  const handleDelete = (id: string) => {
    setChapters(prev => {
      const filtered = prev.filter(ch => ch.id !== id);
      return filtered.map((ch, i) => ({
        ...ch,
        chapterNumber: i + 1,
        id: `ch_${i + 1}`
      }));
    });
    setSelectedForMerge(prev => prev.filter(sid => sid !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setChapters(prev => {
      const newChapters = [...prev];
      [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
      return newChapters.map((ch, i) => ({
        ...ch,
        chapterNumber: i + 1,
        id: `ch_${i + 1}`
      }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === chapters.length - 1) return;
    setChapters(prev => {
      const newChapters = [...prev];
      [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
      return newChapters.map((ch, i) => ({
        ...ch,
        chapterNumber: i + 1,
        id: `ch_${i + 1}`
      }));
    });
  };

  const toggleMergeSelect = (id: string) => {
    setSelectedForMerge(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const handleMerge = () => {
    if (selectedForMerge.length < 2) return;
    
    const toMerge = chapters.filter(ch => selectedForMerge.includes(ch.id));
    const remaining = chapters.filter(ch => !selectedForMerge.includes(ch.id));
    
    const mergedChapter: DetectedChapter = {
      id: `ch_merged_${Date.now()}`,
      chapterNumber: 0,
      title: `Merged: ${toMerge[0].title.split(':')[0]}...`,
      summary: toMerge.map(ch => ch.summary).join(' '),
      keyTopics: Array.from(new Set(toMerge.flatMap(ch => ch.keyTopics))),
      learningObjectives: toMerge.flatMap(ch => ch.learningObjectives),
      startPosition: Math.min(...toMerge.map(ch => ch.startPosition)),
      endPosition: Math.max(...toMerge.map(ch => ch.endPosition)),
      contentPreview: toMerge[0].contentPreview,
      sourceContext: toMerge.map(ch => ch.sourceContext).join('\n\n'),
      confidence: Math.min(...toMerge.map(ch => ch.confidence)),
      boundaryReason: 'Merged from user selection',
      relationshipToPrevious: toMerge[0].relationshipToPrevious,
      relationshipToNext: toMerge[toMerge.length - 1].relationshipToNext,
      detectionMethod: 'semantic'
    };
    
    const insertIndex = chapters.findIndex(ch => ch.id === selectedForMerge[0]);
    const newChapters = [...remaining];
    newChapters.splice(insertIndex, 0, mergedChapter);
    
    setChapters(newChapters.map((ch, i) => ({
      ...ch,
      chapterNumber: i + 1,
      id: `ch_${i + 1}`
    })));
    setSelectedForMerge([]);
    setShowMergeConfirm(false);
  };

  const handleConfirm = () => {
    onConfirm(chapters);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-purple-950/50 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chapter Detection Results</h2>
              <p className="text-sm text-zinc-400">
                We detected {chapters.length} chapters. Review and adjust before generation.
              </p>
            </div>
          </div>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Document Type</p>
            <p className="text-sm font-medium text-white capitalize">{documentAnalysis.detectedType}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Structure</p>
            <p className="text-sm font-medium text-white capitalize">{documentAnalysis.structuralPattern}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Complexity</p>
            <p className="text-sm font-medium text-white capitalize">{documentAnalysis.complexity}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Est. Study Time</p>
            <p className="text-sm font-medium text-white">
              {Object.values(recommendations.estimatedStudyTime).reduce((total, time) => {
                const mins = parseInt(time.match(/\d+/)?.[0] || '0');
                return total + mins;
              }, 0)} min
            </p>
          </div>
        </div>

        {selectedForMerge.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Merge className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200">
                {selectedForMerge.length} chapters selected for merging
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedForMerge([])}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowMergeConfirm(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-medium transition-colors"
              >
                Merge Selected
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
                selectedForMerge.includes(chapter.id) 
                  ? 'border-amber-500/50 ring-1 ring-amber-500/30' 
                  : editingId === chapter.id
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {editingId === chapter.id ? (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1 block">Summary</label>
                    <textarea
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleEditCancel}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleEditSave}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {chapter.chapterNumber}
                      </div>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === chapters.length - 1}
                        className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">{chapter.title}</h3>
                          <p className="text-zinc-400 text-sm line-clamp-2">{chapter.summary}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full bg-zinc-800 ${getConfidenceColor(chapter.confidence)}`}>
                            {getConfidenceLabel(chapter.confidence)} confidence
                          </span>
                        </div>
                      </div>

                      {chapter.keyTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {chapter.keyTopics.slice(0, 5).map((topic, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-zinc-800 rounded-lg text-zinc-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {Math.round((chapter.endPosition - chapter.startPosition) / 3000)} pages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recommendations.estimatedStudyTime[`chapter${chapter.chapterNumber}`] || '10-15 min'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {chapter.learningObjectives.length} objectives
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleMergeSelect(chapter.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedForMerge.includes(chapter.id)
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="Select for merge"
                      >
                        <Merge className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditStart(chapter)}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit chapter"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(chapter.id)}
                        disabled={chapters.length <= 1}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-zinc-500">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Chapters will generate all content types (quizzes, flashcards, notes, mindmaps)
        </div>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Generate Study Kit ({chapters.length} Chapters)
        </button>
      </div>

      <AnimatePresence>
        {showMergeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowMergeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Merge Chapters</h3>
              <p className="text-zinc-400 mb-4">
                Are you sure you want to merge {selectedForMerge.length} chapters into one? 
                This will combine all their content.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMergeConfirm(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMerge}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-medium transition-colors"
                >
                  Merge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
