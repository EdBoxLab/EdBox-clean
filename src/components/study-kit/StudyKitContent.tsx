'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    Brain, Zap, FileText, Map, Loader2, X, ArrowLeft, CheckCircle2,
    Library, Trash2, Upload, Info, Plus, Send, Copy, Check, Clock,
    Target, BookOpen, Briefcase, Table2, Crown, RotateCcw
} from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import {
    CustomEdBoxTable, CustomEdBoxThead, CustomEdBoxTr, CustomEdBoxTh, CustomEdBoxTd
} from '@/components/ui/CustomEdBoxTable';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { NoteNavigation } from '@/components/NoteNavigation';
import { TextSelectionTooltip } from '@/components/TextSelectionTooltip';
import { GenieSidePanel } from '@/components/GenieSidePanel';

// --- SHARED HELPERS (Extracted from page.tsx) ---

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
}

export function preprocessMarkdown(text: string): string {
    if (!text) return '';
    let result = text;
    result = result.replace(/\s+(#{1,6}\s)/g, '\n\n$1');
    result = result.replace(/\s+---\s+/g, '\n\n---\n\n');
    result = result.replace(/\|\s+\|/g, '|\n|');
    return result;
}

export function flattenChapterContent(content: any): any {
    if (!content?.chapters || !Array.isArray(content.chapters)) return content;
    const flat: any = {};
    const chapters = content.chapters;

    const allQuizzes = chapters.flatMap((ch: any) => ch.quizzes || []);
    if (allQuizzes.length > 0) flat.quizzes = allQuizzes;

    const allFlashcards = chapters.flatMap((ch: any) => ch.flashcards || []);
    if (allFlashcards.length > 0) flat.flashcards = allFlashcards;

    const noteTypes = ['deepExplanation', 'cheatsheet', 'application', 'tables'];
    const mergedNotes: any = {};
    let hasAnyNote = false;
    for (const nt of noteTypes) {
        const parts: string[] = [];
        for (const ch of chapters) {
            if (ch.notes?.[nt]) {
                if (chapters.length > 1) {
                    parts.push(`\n\n---\n\n## 📖 ${ch.title}\n\n${ch.notes[nt]}`);
                } else {
                    parts.push(ch.notes[nt]);
                }
            }
        }
        if (parts.length > 0) {
            mergedNotes[nt] = parts.join('');
            hasAnyNote = true;
        } else {
            mergedNotes[nt] = '';
        }
    }
    if (hasAnyNote) flat.notes = mergedNotes;

    const allBranches: any[] = [];
    for (const ch of chapters) {
        if (ch.mindmaps?.branches) {
            allBranches.push(...ch.mindmaps.branches);
        }
    }
    if (allBranches.length > 0) {
        flat.mindmaps = {
            central: chapters.length > 1 ? chapters.map((ch: any) => ch.title).join(' & ') : chapters[0]?.title || 'Study Kit',
            branches: allBranches
        };
    }
    return flat;
}

export const GeneratingView = () => {
    const studyHacks = [
        { icon: <Brain className="w-5 h-5" />, tip: "The Feynman Technique: Explain a concept to a child to master it." },
        { icon: <Zap className="w-5 h-5" />, tip: "Spaced Repetition: Reviewing at increasing intervals boosts long-term memory." },
        { icon: <FileText className="w-5 h-5" />, tip: "Active Recall: Testing yourself is 2x more effective than re-reading." },
        { icon: <Clock className="w-5 h-5" />, tip: "The Pomodoro Technique: Study for 25 minutes, then take a 5-minute break." },
        { icon: <Target className="w-5 h-5" />, tip: "Eat the Frog: Start your study session with the hardest topic." },
        { icon: <Map className="w-5 h-5" />, tip: "Mind Mapping: Visualizing connections improves recall by up to 15%." }
    ];
    const statusMessages = ["Reading material...", "Analyzing concepts...", "Generating notes...", "Crafting quizzes...", "Building kit...", "Optimizing retention...", "Polishing..."];
    const [hackIndex, setHackIndex] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    useEffect(() => {
        const hT = setInterval(() => setHackIndex(p => (p + 1) % studyHacks.length), 5000);
        const sT = setInterval(() => setStatusIndex(p => (p + 1) % statusMessages.length), 3500);
        return () => { clearInterval(hT); clearInterval(sT); };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-10 max-w-2xl mx-auto">
            <div className="relative">
                <motion.div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[60px]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-6">
                        <Loader2 className="w-full h-full text-indigo-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-8 h-8 text-indigo-400 animate-pulse" /></div>
                    </div>
                    <AnimatePresence mode="wait"><motion.h2 key={statusIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{statusMessages[statusIndex]}</motion.h2></AnimatePresence>
                    <p className="text-zinc-500 mt-2 text-sm italic">Sit tight, we're doing the heavy lifting...</p>
                </div>
            </div>
            <div className="w-full max-w-md space-y-4">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 w-full" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} /></div>
                <div className="grid grid-cols-2 gap-3">{statusMessages.slice(0, 4).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${i <= statusIndex ? 'bg-indigo-500' : 'bg-zinc-700'}`} />
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${i <= statusIndex ? 'text-indigo-400' : 'text-zinc-600'}`}>{i === statusIndex ? 'In Progress' : i < statusIndex ? 'Complete' : 'Pending'}</span>
                    </div>
                ))}</div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-indigo-600/5 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Info className="w-12 h-12 text-indigo-500" /></div>
                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap className="w-3 h-3" /> Pro Study Hack</span>
                    <AnimatePresence mode="wait"><motion.div key={hackIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center gap-4"><div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">{studyHacks[hackIndex].icon}</div><p className="text-zinc-300 font-medium leading-relaxed max-w-[320px]">{studyHacks[hackIndex].tip}</p></motion.div></AnimatePresence>
                    <div className="flex gap-1.5 mt-6">{studyHacks.map((_, i) => (<div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === hackIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-zinc-800'}`} />))}</div>
                </div>
            </motion.div>
        </div>
    );
};

export const FlashcardItem = ({ card }: { card: any }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div className="h-80 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div className="relative w-full h-full" transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }} animate={{ rotateY: isFlipped ? 180 : 0 }} style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 w-full h-full backface-hidden bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
                    <div className="absolute top-4 left-4 text-[10px] uppercase font-bold text-indigo-400">Front</div>
                    <p className="font-bold text-xl text-white leading-tight break-words">{card.front || card.question}</p>
                </div>
                <div className="absolute inset-0 w-full h-full backface-hidden bg-indigo-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className="absolute top-4 left-4 text-[10px] uppercase font-bold text-indigo-300">Back</div>
                    <p className="font-medium text-lg text-indigo-50 leading-relaxed break-words">{card.back || card.answer}</p>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface StudyKitContentProps {
    kitId?: string | null;
    embedded?: boolean;
}

export function StudyKitContent({ kitId: propKitId, embedded = false }: StudyKitContentProps) {
    const [mounted, setMounted] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = propKitId || searchParams.get('id');
    const supabase = createSupabaseBrowserClient();
    const { isOpen, content, openShareModal, closeShareModal } = useShareModal();
    const windowSize = useWindowSize();
    const { isPremium } = useSubscription();

    const [prompt, setPrompt] = useState('');
    const [multiSelectedTypes, setMultiSelectedTypes] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [studyKits, setStudyKits] = useState<any[]>([]);
    const [isLoadingKits, setIsLoadingKits] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<'menu' | 'options' | 'confirm' | 'generating' | 'result'>(id ? 'result' : 'menu');

    const [currentQuizStates, setCurrentQuizStates] = useState<any[]>([]);
    const [score, setScore] = useState<{ correct: number, total: number } | null>(null);
    const [countOption, setCountOption] = useState<number>(10);
    const [depthOption, setDepthOption] = useState<'summary' | 'deepdive' | 'coverage' | 'shi'>('coverage');
    const [activeChapter, setActiveChapter] = useState(0);
    const [activeNoteType, setActiveNoteType] = useState<any>('deepExplanation');
    const [hasChapters, setHasChapters] = useState(false);
    const [chapterContent, setChapterContent] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'chapters' | 'flat'>('flat');
    const [studyKit, setStudyKit] = useState<any>(null);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesSpecification, setNotesSpecification] = useState('');
    const [showAdModal, setShowAdModal] = useState(false);
    const [adContentType, setAdContentType] = useState<any>(null);
    const [adCountdown, setAdCountdown] = useState(5);
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [notesAdRewarded, setNotesAdRewarded] = useState(false);
    const [isGenieOpen, setIsGenieOpen] = useState(false);
    const [genieContext, setGenieContext] = useState('');

    useEffect(() => { setMounted(true); }, []);

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
            const res = await fetch('/api/study-kit/list');
            const data = await res.json();
            if (data.studyKits) setStudyKits(data.studyKits);
        } catch (e) { console.error(e); }
        finally { setIsLoadingKits(false); }
    };

    const fetchStudyKit = async (kitId: string) => {
        try {
            const res = await fetch(`/api/study-kit/${kitId}`);
            const data = await res.json();
            if (data.studyKit) {
                const kit = data.studyKit;
                setStudyKit(kit);
                const normalized = normalizeContent(kit.generated_content, kit.content_types || []);
                setGeneratedContent(normalized);
                setSelectedTypes(kit.content_types || []);
                setActiveTab(kit.content_types?.[0] || null);
                if (normalized.quizzes) setCurrentQuizStates(normalized.quizzes.map(() => ({ selectedOption: null, isConfirmed: false })));
            }
        } catch (e) { console.error(e); }
    };

    const normalizeContent = (content: any, requestedTypes: string[]) => {
        if (content?.chapters) {
            setHasChapters(true);
            setChapterContent(content.chapters);
            setViewMode('chapters');
            content = flattenChapterContent(content);
        } else { setHasChapters(false); setViewMode('flat'); }

        const parse = (d: any) => {
            if (typeof d !== 'string') return d;
            try { return JSON.parse(d); } catch { return d; }
        };

        const normalized: any = {};
        requestedTypes.forEach(t => {
            if (t === 'quizzes' || t === 'flashcards') normalized[t] = [];
            else if (t === 'notes') normalized[t] = { deepExplanation: '', cheatsheet: '', application: '', tables: '' };
        });

        if (content.quizzes) normalized.quizzes = parse(content.quizzes);
        if (content.flashcards) normalized.flashcards = parse(content.flashcards);
        if (content.notes) normalized.notes = parse(content.notes);
        if (content.mindmaps) normalized.mindmaps = parse(content.mindmaps);

        return normalized;
    };

    const getDisplayContent = () => {
        if (!generatedContent) return null;
        if (viewMode === 'flat' || !hasChapters || !chapterContent[activeChapter]) return generatedContent;
        const ch = chapterContent[activeChapter];
        return {
            quizzes: ch.quizzes || [],
            flashcards: ch.flashcards || [],
            notes: ch.notes || { deepExplanation: '', cheatsheet: '', application: '', tables: '' },
            mindmaps: ch.mindmaps || null
        };
    };

    const handleBackToCreate = () => {
        if (embedded) {
            setGeneratedContent(null);
            setCurrentStep('menu');
        } else router.push('/tools/study-kit');
    };

    if (!mounted) return null;

    return (
        <div className={`w-full ${embedded ? '' : 'min-h-screen bg-transparent text-white p-0'}`}>
            <AnimatePresence mode="wait">
                {currentStep === 'generating' ? <GeneratingView /> : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto">
                        {generatedContent ? (
                            <div className="space-y-6">
                                {/* Simple View for Verification */}
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold">{studyKit?.title || 'Study Kit'}</h2>
                                    <div className="flex gap-2">
                                        {selectedTypes.map(t => (
                                            <Button key={t} variant={activeTab === t ? 'default' : 'outline'} onClick={() => setActiveTab(t)}>
                                                {t}
                                            </Button>
                                        ))}
                                        <Button variant="ghost" onClick={handleBackToCreate}><X className="w-4 h-4 mr-2" /> Close</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {activeTab === 'quizzes' && (
                                        <div className="space-y-4">
                                            {getDisplayContent()?.quizzes?.map((q: any, i: number) => (
                                                <div key={i} className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                                    <p className="text-lg font-medium mb-4">{q.question}</p>
                                                    <div className="grid gap-2">
                                                        {q.options?.map((o: any, oi: number) => (
                                                            <div key={oi} className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
                                                                {o}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'flashcards' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {getDisplayContent()?.flashcards?.map((c: any, i: number) => (
                                                <FlashcardItem key={i} card={c} />
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'notes' && (
                                        <div className="p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 prose prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {getDisplayContent()?.notes?.[activeNoteType] || 'No notes available'}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Brain className="w-20 h-20 text-indigo-500 mb-6 opacity-20" />
                                <h2 className="text-2xl font-bold mb-2">No Content Available</h2>
                                <p className="text-zinc-500 max-w-sm mb-8">This study kit doesn't have any generated content or it's still being processed.</p>
                                {!embedded && (
                                    <Button onClick={() => router.push('/tools/study-kit')} className="bg-indigo-600 hover:bg-indigo-500">
                                        Create New Kit
                                    </Button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StudyKitContent;
