'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Loader2,
    Plus,
    X,
    Info,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contentTypes } from '../constants';
import { NoteSubTab } from '../constants';
import { QuizzesView } from './QuizzesView';
import { FlashcardsView } from './FlashcardsView';
import { NotesView } from './NotesView';
import { MindmapView } from './MindmapView';

interface ResultsViewProps {
    generatedContent: any;
    selectedTypes: string[];
    activeTab: string | null;
    setActiveTab: (tab: string | null) => void;
    id: string | null;
    setGeneratedContent: (v: any) => void;
    setMultiSelectedTypes: (v: string[]) => void;
    setCurrentStep: (step: 'menu' | 'options' | 'confirm' | 'generating' | 'result') => void;

    hasChapters: boolean;
    chapterContent: any[];
    activeChapter: number;
    setActiveChapter: (v: number) => void;
    viewMode: 'chapters' | 'flat';
    setViewMode: (v: 'chapters' | 'flat') => void;
    getDisplayContent: () => any;

    isPremium: boolean;
    router: any;

    studyKit: any;
    isGeneratingMore: boolean;
    handleGenerateMore: (type: 'quizzes' | 'flashcards' | 'notes', notesSpec?: string, isAdReward?: boolean) => void;
    handleWatchAd: (type: 'quizzes' | 'flashcards' | 'notes') => void;

    currentQuizStates: any[];
    setCurrentQuizStates: (v: any[]) => void;
    score: { correct: number; total: number } | null;
    setScore: (v: { correct: number; total: number } | null) => void;

    activeNoteType: NoteSubTab;
    setActiveNoteType: (v: NoteSubTab) => void;
    handleAskGenie: (text: string) => void;
    isGenieOpen: boolean;
    setIsGenieOpen: (v: boolean) => void;
    genieContext: string;
    showNotesModal: boolean;
    setShowNotesModal: (v: boolean) => void;
    notesSpecification: string;
    setNotesSpecification: (v: string) => void;
    notesAdRewarded: boolean;
    setNotesAdRewarded: (v: boolean) => void;

    mindmapDragPosition: { x: number; y: number };
    setMindmapDragPosition: (v: { x: number; y: number }) => void;
    selectedNodeData: any;
    setSelectedNodeData: (v: any) => void;
    windowSize: { width: number; height: number };
}

export function ResultsView({
    generatedContent,
    selectedTypes,
    activeTab,
    setActiveTab,
    id,
    setGeneratedContent,
    setMultiSelectedTypes,
    setCurrentStep,
    hasChapters,
    chapterContent,
    activeChapter,
    setActiveChapter,
    viewMode,
    setViewMode,
    getDisplayContent,
    isPremium,
    router,
    studyKit,
    isGeneratingMore,
    handleGenerateMore,
    handleWatchAd,
    currentQuizStates,
    setCurrentQuizStates,
    score,
    setScore,
    activeNoteType,
    setActiveNoteType,
    handleAskGenie,
    isGenieOpen,
    setIsGenieOpen,
    genieContext,
    showNotesModal,
    setShowNotesModal,
    notesSpecification,
    setNotesSpecification,
    notesAdRewarded,
    setNotesAdRewarded,
    mindmapDragPosition,
    setMindmapDragPosition,
    selectedNodeData,
    setSelectedNodeData,
    windowSize,
}: ResultsViewProps) {
    return (
        <div className="space-y-6">
            {(() => {
                const requestedCount = selectedTypes.length;
                const actualCount = Object.keys(generatedContent).filter(k => {
                    const data = generatedContent[k];
                    if (!data) return false;
                    if (Array.isArray(data)) return data.length > 0;
                    return true;
                }).length;

                if (actualCount > 0 && actualCount < requestedCount) {
                    return (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200 text-sm mb-4">
                            Note: Some content types couldn&apos;t be generated perfectly and were skipped.
                        </div>
                    );
                }
                return null;
            })()}

            {hasChapters && chapterContent.length > 0 && (
                <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Study by Chapters</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('chapters')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'chapters'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                By Chapter
                            </button>
                            <button
                                onClick={() => setViewMode('flat')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'flat'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                All Content
                            </button>
                        </div>
                    </div>

                    {viewMode === 'chapters' && (
                        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))}
                                    disabled={activeChapter === 0}
                                    className="flex items-center gap-1 px-3 py-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                <div className="text-sm text-zinc-400">
                                    Chapter {activeChapter + 1} of {chapterContent.length}
                                </div>

                                <button
                                    onClick={() => setActiveChapter(Math.min(chapterContent.length - 1, activeChapter + 1))}
                                    disabled={activeChapter === chapterContent.length - 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {chapterContent.map((chapter, index) => (
                                    <button
                                        key={chapter.id || index}
                                        onClick={() => setActiveChapter(index)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${index === activeChapter
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {index + 1}. {chapter.title?.replace(/^(Chapter \d+:?\s*)?/i, '').slice(0, 20) || `Chapter ${index + 1}`}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 bg-zinc-800/50 rounded-lg p-3">
                                <h4 className="font-semibold text-white mb-1">
                                    {chapterContent[activeChapter]?.title || `Chapter ${activeChapter + 1}`}
                                </h4>
                                <p className="text-sm text-zinc-400">
                                    {chapterContent[activeChapter]?.summary || 'No summary available'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-zinc-800">
                {selectedTypes.map(typeId => {
                    const type = contentTypes.find(t => t.id === typeId);
                    const Icon = type?.icon || FileText;
                    return (
                        <button
                            key={typeId}
                            onClick={() => setActiveTab(typeId)}
                            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 border-b-2 transition ${activeTab === typeId
                                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {type?.label}
                        </button>
                    );
                })}
                {!id && (
                    <button
                        onClick={() => {
                            setGeneratedContent(null);
                            setMultiSelectedTypes([]);
                            setCurrentStep('menu');
                        }}
                        className="ml-auto px-4 py-2 text-zinc-500 hover:text-white transition flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Create New
                    </button>
                )}
            </div>

            <div className="min-h-[400px]">
                {!isPremium && (
                    <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Info className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Sponsored Study Break</p>
                                <p className="text-xs text-zinc-400">Upgrade to Premium to remove all ads and unlock unlimited kits.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/pricing')}
                            variant="outline"
                            size="sm"
                            className="border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                        >
                            Remove Ads
                        </Button>
                    </div>
                )}

                {studyKit && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-zinc-900/80 to-zinc-800/50 border border-zinc-700/50 rounded-2xl">
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <span className="text-sm text-zinc-400 mr-2">Add more content:</span>
                            {isPremium ? (
                                <>
                                    <button
                                        onClick={() => handleGenerateMore('quizzes')}
                                        disabled={isGeneratingMore}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-xs transition-all"
                                    >
                                        {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        10 Quizzes
                                    </button>
                                    <button
                                        onClick={() => handleGenerateMore('flashcards')}
                                        disabled={isGeneratingMore}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-xs transition-all"
                                    >
                                        {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        10 Flashcards
                                    </button>
                                    <button
                                        onClick={() => setShowNotesModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-xs transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Custom Notes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleWatchAd('quizzes')}
                                        disabled={isGeneratingMore}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-xs transition-all"
                                    >
                                        {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Ad for 10 Quizzes
                                    </button>
                                    <button
                                        onClick={() => handleWatchAd('flashcards')}
                                        disabled={isGeneratingMore}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-xs transition-all"
                                    >
                                        {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Ad for 10 Flashcards
                                    </button>
                                    <button
                                        onClick={() => handleWatchAd('notes')}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold text-xs transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Ad for Custom Notes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeTab}-${viewMode}-${activeChapter}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {(() => {
                            const displayContent = getDisplayContent();
                            if (!displayContent) return null;

                            return (
                                <>
                                    {activeTab === 'quizzes' && displayContent.quizzes && (
                                        <QuizzesView
                                            displayContent={displayContent}
                                            currentQuizStates={currentQuizStates}
                                            setCurrentQuizStates={setCurrentQuizStates}
                                            score={score}
                                            setScore={setScore}
                                            studyKit={studyKit}
                                            isPremium={isPremium}
                                            isGeneratingMore={isGeneratingMore}
                                            handleGenerateMore={handleGenerateMore}
                                            handleWatchAd={handleWatchAd}
                                        />
                                    )}

                                    {activeTab === 'flashcards' && displayContent.flashcards && (
                                        <FlashcardsView
                                            displayContent={displayContent}
                                            studyKit={studyKit}
                                            isPremium={isPremium}
                                            isGeneratingMore={isGeneratingMore}
                                            handleGenerateMore={handleGenerateMore}
                                            handleWatchAd={handleWatchAd}
                                        />
                                    )}

                                    {activeTab === 'notes' && displayContent.notes && (
                                        <NotesView
                                            displayContent={displayContent}
                                            activeNoteType={activeNoteType}
                                            setActiveNoteType={setActiveNoteType}
                                            handleAskGenie={handleAskGenie}
                                            isGenieOpen={isGenieOpen}
                                            setIsGenieOpen={setIsGenieOpen}
                                            genieContext={genieContext}
                                            showNotesModal={showNotesModal}
                                            setShowNotesModal={setShowNotesModal}
                                            notesSpecification={notesSpecification}
                                            setNotesSpecification={setNotesSpecification}
                                            notesAdRewarded={notesAdRewarded}
                                            setNotesAdRewarded={setNotesAdRewarded}
                                            studyKit={studyKit}
                                            isPremium={isPremium}
                                            isGeneratingMore={isGeneratingMore}
                                            handleGenerateMore={handleGenerateMore}
                                            handleWatchAd={handleWatchAd}
                                        />
                                    )}

                                    {activeTab === 'mindmaps' && displayContent.mindmaps && (
                                        <MindmapView
                                            displayContent={displayContent}
                                            mindmapDragPosition={mindmapDragPosition}
                                            setMindmapDragPosition={setMindmapDragPosition}
                                            selectedNodeData={selectedNodeData}
                                            setSelectedNodeData={setSelectedNodeData}
                                            windowSize={windowSize}
                                        />
                                    )}
                                </>
                            );
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
