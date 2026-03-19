'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useWindowSize } from '@/lib/hooks/useWindowSize';
import posthog from 'posthog-js';
import { useStudyKitStream } from '@/lib/hooks/useStudyKitStream';
import { NoteSubTab } from './constants';
import { normalizeContent, flattenChapterContent } from './utils';
import { GeneratingView } from './_components/GeneratingView';
import { MenuStage } from './_components/MenuStage';
import { OptionsStage } from './_components/OptionsStage';
import { ConfirmStage } from './_components/ConfirmStage';
import { ResultsView } from './_components/ResultsView';
import { ChapterReviewModal } from './_components/ChapterReviewModal';
import { AdModal } from './_components/AdModal';

function StudyKitContent() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const supabase = createSupabaseBrowserClient();
    const { isOpen, content, openShareModal, closeShareModal } = useShareModal();
    const windowSize = useWindowSize();
    const { isPremium } = useSubscription();

    const { streamGenerate } = useStudyKitStream({
        onComplete: () => setCurrentStep('result')
    });

    const [prompt, setPrompt] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoadingKit, setIsLoadingKit] = useState(false);
    const [studyKit, setStudyKit] = useState<any>(null);
    const [studyKits, setStudyKits] = useState<any[]>([]);
    const [isLoadingKits, setIsLoadingKits] = useState(false);
    const [user, setUser] = useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [currentQuizStates, setCurrentQuizStates] = useState<any[]>([]);
    const [score, setScore] = useState<{ correct: number, total: number } | null>(null);

    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesSpecification, setNotesSpecification] = useState('');
    const [showAdModal, setShowAdModal] = useState(false);
    const [adContentType, setAdContentType] = useState<'quizzes' | 'flashcards' | 'notes' | null>(null);
    const [adCountdown, setAdCountdown] = useState(5);
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [notesAdRewarded, setNotesAdRewarded] = useState(false);

    const [multiSelectedTypes, setMultiSelectedTypes] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<'menu' | 'options' | 'confirm' | 'generating' | 'result'>('menu');
    const [countOption, setCountOption] = useState<number>(10);
    const [depthOption, setDepthOption] = useState<'summary' | 'deepdive' | 'coverage' | 'shi'>('coverage');
    const [activeChapter, setActiveChapter] = useState(0);
    const [activeNoteType, setActiveNoteType] = useState<NoteSubTab>('deepExplanation');
    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    const [genieContext, setGenieContext] = useState('');
    const [isGenieOpen, setIsGenieOpen] = useState(false);
    const [mindmapDragPosition, setMindmapDragPosition] = useState({ x: 0, y: 0 });

    const [detectedChapters, setDetectedChapters] = useState<any[]>([]);
    const [showChapterReview, setShowChapterReview] = useState(false);
    const [chapterDetectionMeta, setChapterDetectionMeta] = useState<any>(null);

    const [hasChapters, setHasChapters] = useState(false);
    const [chapterContent, setChapterContent] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'chapters' | 'flat'>('flat');

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const handleAskGenie = (text: string) => {
        setGenieContext(text);
        setIsGenieOpen(true);
    };

    const applyNormalization = (rawContent: any, requestedTypes: string[]) => {
        const { normalized, chapterInfo } = normalizeContent(rawContent, requestedTypes);
        setHasChapters(chapterInfo.hasChapters);
        setChapterContent(chapterInfo.chapters);
        setViewMode(chapterInfo.viewMode);
        if (chapterInfo.hasChapters) setActiveChapter(0);
        return normalized;
    };

    useEffect(() => {
        if (id) fetchStudyKit(id);
        else fetchAllStudyKits();
        getUser();
    }, [id]);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const fetchAllStudyKits = async () => {
        setIsLoadingKits(true);
        try {
            const response = await fetch('/api/study-kit/list');
            const data = await response.json();
            if (data.studyKits) setStudyKits(data.studyKits);
        } catch (err) {
            console.error('Error fetching study kits:', err);
        } finally {
            setIsLoadingKits(false);
        }
    };

    const handleDeleteStudyKit = async (e: React.MouseEvent, kitId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this study kit?')) return;

        try {
            const deletedKit = studyKits.find(k => k.id === kitId);
            const response = await fetch(`/api/study-kit/${kitId}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                setStudyKits(studyKits.filter(k => k.id !== kitId));
                posthog.capture('study_kit_deleted', {
                    kit_id: kitId,
                    kit_title: deletedKit?.title,
                    content_types: deletedKit?.content_types,
                });
                if (id === kitId) router.push('/tools/study-kit');
            } else {
                alert(data.error || 'Failed to delete study kit');
            }
        } catch (err) {
            console.error('Error deleting study kit:', err);
            alert('Failed to delete study kit');
        }
    };

    const fetchStudyKit = async (kitId: string) => {
        setIsLoadingKit(true);
        try {
            const response = await fetch(`/api/study-kit/${kitId}`);
            const data = await response.json();

            if (data.studyKit) {
                const kit = data.studyKit;
                setStudyKit(kit);
                const normalized = applyNormalization(kit.generated_content, kit.content_types || []);
                setGeneratedContent(normalized);
                setSelectedTypes(kit.content_types || []);
                setActiveTab(kit.content_types?.[0] || null);

                if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                    setCurrentQuizStates(normalized.quizzes.map(() => ({ selectedOption: null, isConfirmed: false })));
                    setScore(null);
                }
            } else {
                setError(data.error || 'Study kit not found');
            }
        } catch (err) {
            console.error('Error fetching study kit:', err);
            setError('Failed to load study kit');
        } finally {
            setIsLoadingKit(false);
        }
    };

    const getDisplayContent = () => {
        if (!generatedContent) return null;
        if (viewMode === 'flat' || !hasChapters || chapterContent.length === 0) return generatedContent;

        const currentChapter = chapterContent[activeChapter];
        if (!currentChapter) return generatedContent;

        return {
            quizzes: currentChapter.quizzes || [],
            flashcards: currentChapter.flashcards || [],
            notes: currentChapter.notes || { deepExplanation: '', cheatsheet: '', application: '', tables: '' },
            mindmaps: currentChapter.mindmaps || null
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > MAX_FILE_SIZE) {
                setError('File size exceeds 10MB. Please upload in smaller batches or reduce file size.');
                return;
            }
            setUploadedFile(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleGenerate = async () => {
        const types = multiSelectedTypes;
        if ((!prompt.trim() && !uploadedFile) || types.length === 0 || isGenerating) return;

        setIsGenerating(true);
        setCurrentStep('generating');
        setGeneratedContent(null);
        setActiveTab(null);

        try {
            let fileData = null;
            if (uploadedFile) {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(uploadedFile);
                });
                const content = await base64Promise;
                fileData = { name: uploadedFile.name, type: uploadedFile.type, content };
            }

            if (!uploadedFile && prompt.trim()) {
                const result = await streamGenerate({
                    prompt,
                    contentTypes: types,
                    itemCount: countOption,
                    notesDepth: depthOption
                });

                if (result) {
                    const normalized = applyNormalization(result, types);
                    posthog.capture('study_kit_generated', {
                        prompt, content_types: types, item_count: countOption, notes_depth: depthOption, has_file: false
                    });
                    setSelectedTypes(types);
                    setGeneratedContent(normalized);
                    setActiveTab(types[0]);

                    if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                        setCurrentQuizStates(normalized.quizzes.map(() => ({ selectedOption: null, isConfirmed: false })));
                        setScore(null);
                    }
                }
                return;
            }

            const response = await fetch('/api/study-kit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt, contentTypes: types, itemCount: countOption, notesDepth: depthOption,
                    fileName: uploadedFile?.name, fileContent: fileData?.content, fileType: fileData?.type,
                    useChapters: !!uploadedFile
                }),
            });

            const data = await response.json();

            if (data.needsChapterReview) {
                setDetectedChapters(data.chapters);
                setChapterDetectionMeta({
                    documentAnalysis: data.documentAnalysis, recommendations: data.recommendations,
                    fileName: data.fileName, textSize: data.textSize
                });
                setShowChapterReview(true);
                setCurrentStep('confirm');
                setIsGenerating(false);
                return;
            }

            if (data.success) {
                const normalized = applyNormalization(data.content, types);
                posthog.capture('study_kit_generated', {
                    prompt, content_types: types, item_count: countOption, notes_depth: depthOption, has_file: !!uploadedFile
                });

                setTimeout(() => {
                    setSelectedTypes(types);
                    setGeneratedContent(normalized);
                    setActiveTab(types[0]);
                    setCurrentStep('result');

                    if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                        setCurrentQuizStates(normalized.quizzes.map(() => ({ selectedOption: null, isConfirmed: false })));
                        setScore(null);
                    }
                }, 0);
            } else {
                alert('Generation failed: ' + data.error);
                setCurrentStep('confirm');
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate content. Please try again.');
            setCurrentStep('confirm');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmChapters = async (confirmedChapters: any[]) => {
        setShowChapterReview(false);
        setIsGenerating(true);
        setCurrentStep('generating');

        try {
            const types = multiSelectedTypes;
            const response = await fetch('/api/study-kit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt, contentTypes: types, itemCount: countOption, notesDepth: depthOption,
                    fileName: chapterDetectionMeta?.fileName, useChapters: true, chapters: confirmedChapters
                }),
            });

            const data = await response.json();

            if (data.success) {
                posthog.capture('study_kit_generated_with_chapters', {
                    prompt, content_types: types, chapter_count: confirmedChapters.length, has_file: true
                });

                setTimeout(() => {
                    setSelectedTypes(types);
                    if (data.content?.chapters && Array.isArray(data.content.chapters)) {
                        setHasChapters(true);
                        setChapterContent(data.content.chapters);
                        setViewMode('chapters');
                        setActiveChapter(0);
                    }
                    const flatContent = flattenChapterContent(data.content);
                    setGeneratedContent(flatContent);
                    setActiveTab(types[0] || null);
                    setCurrentStep('result');
                    setDetectedChapters([]);
                    setChapterDetectionMeta(null);
                }, 0);
            } else {
                alert('Generation failed: ' + data.error);
                setCurrentStep('confirm');
            }
        } catch (error) {
            console.error('Chapter generation error:', error);
            alert('Failed to generate chapter content. Please try again.');
            setCurrentStep('confirm');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCancelChapterReview = () => {
        setShowChapterReview(false);
        setDetectedChapters([]);
        setChapterDetectionMeta(null);
        setCurrentStep('confirm');
    };

    const handleBackToCreate = () => {
        if (window.history.length > 1) router.back();
        else router.push('/tools/study-kit');
    };

    const handleGenerateMore = async (contentType: 'quizzes' | 'flashcards' | 'notes', notesSpec?: string, isAdReward: boolean = false) => {
        if (!studyKit?.id) return;
        if (!isPremium && !isAdReward) return;

        setIsGeneratingMore(true);
        try {
            const existingContent = generatedContent?.[contentType];
            const response = await fetch('/api/study-kit/generate-more', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studyKitId: studyKit.id, contentType,
                    existingContent: Array.isArray(existingContent) ? existingContent : undefined,
                    notesSpecification: notesSpec || notesSpecification, isAdReward,
                }),
            });

            const data = await response.json();

            if (data.success) {
                posthog.capture('study_kit_generate_more', {
                    kit_id: studyKit.id, content_type: contentType,
                    new_items_count: Array.isArray(data.newContent) ? data.newContent.length : 1,
                });

                setGeneratedContent((prev: any) => ({ ...prev, [contentType]: data.updatedContent }));
                setStudyKit((prev: any) => ({
                    ...prev,
                    generated_content: { ...prev.generated_content, [contentType]: data.updatedContent }
                }));

                if (contentType === 'quizzes' && Array.isArray(data.updatedContent)) {
                    setCurrentQuizStates(data.updatedContent.map(() => ({ selectedOption: null, isConfirmed: false })));
                    setScore(null);
                }

                if (contentType === 'notes') {
                    setShowNotesModal(false);
                    setNotesSpecification('');
                }
            } else {
                alert('Generation failed: ' + data.error);
            }
        } catch (error) {
            console.error('Generate more error:', error);
            alert('Failed to generate more content. Please try again.');
        } finally {
            setIsGeneratingMore(false);
        }
    };

    const handleWatchAd = (contentType: 'quizzes' | 'flashcards' | 'notes') => {
        setAdContentType(contentType);
        setShowAdModal(true);
        setAdCountdown(5);
        setIsWatchingAd(true);
    };

    useEffect(() => {
        if (isWatchingAd && adCountdown > 0) {
            const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (isWatchingAd && adCountdown === 0) {
            setIsWatchingAd(false);
        }
    }, [isWatchingAd, adCountdown]);

    const handleAdComplete = async () => {
        setShowAdModal(false);
        if (adContentType && adContentType !== 'notes') {
            await handleGenerateMore(adContentType, undefined, true);
        } else if (adContentType === 'notes') {
            setNotesAdRewarded(true);
            setShowNotesModal(true);
        }
        setAdContentType(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-8">
                    {id && studyKit ? (
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button onClick={handleBackToCreate} className="p-2 hover:bg-zinc-800 rounded-lg transition">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                        {studyKit.title}
                                    </h1>
                                    <p className="text-zinc-400 text-sm mt-1">
                                        Created {new Date(studyKit.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <ShareButton
                                content={{
                                    type: 'studylist',
                                    id: studyKit.id,
                                    title: studyKit.title,
                                    description: `Comprehensive study materials including ${selectedTypes.join(', ')}`,
                                    creatorName: user?.user_metadata?.full_name || user?.email || 'EdBox User'
                                }}
                                userId={user?.id}
                                variant="button"
                                size="md"
                                showCount={true}
                            />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                Study Kit Generator
                            </h1>
                            <p className="text-zinc-400">
                                Upload materials or enter a prompt to generate comprehensive study resources.
                            </p>
                        </>
                    )}
                </div>

                {!generatedContent && !id ? (
                    <div className="max-w-4xl mx-auto">
                        {showChapterReview && (
                            <ChapterReviewModal
                                detectedChapters={detectedChapters}
                                mounted={mounted}
                                onConfirm={handleConfirmChapters}
                                onCancel={handleCancelChapterReview}
                            />
                        )}

                        <AnimatePresence mode="wait">
                            {currentStep === 'menu' && (
                                <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                    <MenuStage
                                        multiSelectedTypes={multiSelectedTypes}
                                        toggleContentType={(id: string) => {
                                            if (multiSelectedTypes.includes(id)) {
                                                setMultiSelectedTypes(multiSelectedTypes.filter(t => t !== id));
                                            } else {
                                                setMultiSelectedTypes([...multiSelectedTypes, id]);
                                            }
                                        }}
                                        setCurrentStep={setCurrentStep}
                                        isLoadingKits={isLoadingKits}
                                        studyKits={studyKits}
                                        handleDeleteStudyKit={handleDeleteStudyKit}
                                    />
                                </motion.div>
                            )}

                            {currentStep === 'options' && (
                                <motion.div key="options" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <OptionsStage
                                        multiSelectedTypes={multiSelectedTypes}
                                        countOption={countOption}
                                        setCountOption={setCountOption}
                                        depthOption={depthOption}
                                        setDepthOption={setDepthOption}
                                        setCurrentStep={setCurrentStep}
                                    />
                                </motion.div>
                            )}

                            {currentStep === 'confirm' && (
                                <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                    <ConfirmStage
                                        multiSelectedTypes={multiSelectedTypes}
                                        setCurrentStep={setCurrentStep}
                                        prompt={prompt}
                                        setPrompt={setPrompt}
                                        uploadedFile={uploadedFile}
                                        setUploadedFile={setUploadedFile}
                                        handleFileChange={handleFileChange}
                                        fileInputRef={fileInputRef}
                                        depthOption={depthOption}
                                        countOption={countOption}
                                        isGenerating={isGenerating}
                                        handleGenerate={handleGenerate}
                                    />
                                </motion.div>
                            )}

                            {currentStep === 'generating' && (
                                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <GeneratingView />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : generatedContent ? (
                    <ResultsView
                        generatedContent={generatedContent}
                        selectedTypes={selectedTypes}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        id={id}
                        setGeneratedContent={setGeneratedContent}
                        setMultiSelectedTypes={setMultiSelectedTypes}
                        setCurrentStep={setCurrentStep}
                        hasChapters={hasChapters}
                        chapterContent={chapterContent}
                        activeChapter={activeChapter}
                        setActiveChapter={setActiveChapter}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        getDisplayContent={getDisplayContent}
                        isPremium={isPremium}
                        router={router}
                        studyKit={studyKit}
                        isGeneratingMore={isGeneratingMore}
                        handleGenerateMore={handleGenerateMore}
                        handleWatchAd={handleWatchAd}
                        currentQuizStates={currentQuizStates}
                        setCurrentQuizStates={setCurrentQuizStates}
                        score={score}
                        setScore={setScore}
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
                        mindmapDragPosition={mindmapDragPosition}
                        setMindmapDragPosition={setMindmapDragPosition}
                        selectedNodeData={selectedNodeData}
                        setSelectedNodeData={setSelectedNodeData}
                        windowSize={windowSize}
                    />
                ) : null}
            </div>

            <ShareModal
                isOpen={isOpen}
                onClose={closeShareModal}
                content={content || {
                    type: 'studylist',
                    id: studyKit?.id || '',
                    title: studyKit?.title || 'Study Kit',
                    description: 'Comprehensive study materials created with EdBox'
                }}
                userId={user?.id}
            />

            <AdModal
                showAdModal={showAdModal}
                setShowAdModal={setShowAdModal}
                adContentType={adContentType}
                isWatchingAd={isWatchingAd}
                adCountdown={adCountdown}
                handleAdComplete={handleAdComplete}
                onNavigatePricing={() => router.push('/pricing')}
            />
        </div>
    );
}

export default function StudyKitPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
                    <p className="text-zinc-400">Loading...</p>
                </div>
            </div>
        }>
            <StudyKitContent />
        </Suspense>
    );
}