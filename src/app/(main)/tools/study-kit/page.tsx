'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    Brain,
    Zap,
    FileText,
    Map,
    Loader2,
    X,
    ArrowLeft,
    CheckCircle2,
    Library,
    Trash2,
    Upload,
    Info,
    Plus,
    Sparkles,
    Crown,
    Send,
    Copy,
    Check
} from 'lucide-react';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSubscription } from '@/lib/hooks/useSubscription';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';

const contentTypes = [

    { id: 'quizzes', label: 'Quizzes', icon: Brain, description: 'Multiple choice, true/false, and short answer' },
    { id: 'flashcards', label: 'Flashcards', icon: Zap, description: 'Front and back study cards' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Structured summary notes' },
    { id: 'mindmaps', label: 'Mind Maps', icon: Map, description: 'Visual concept connections' },
];

const FlashcardItem = ({ card }: { card: any }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [showHint, setShowHint] = useState(false);

    return (
        <div className="h-64 perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
                className="relative w-full h-full"
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Front</div>
                    <p className="font-bold text-xl text-white leading-tight">{card.front}</p>
                    {card.hint && (
                        <div className="mt-4" onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}>
                            <p className={`text-xs px-2 py-1 bg-zinc-800 rounded-full transition-all ${showHint ? 'text-indigo-300' : 'text-zinc-500'}`}>
                                {showHint ? card.hint : 'Tap for hint'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 w-full h-full backface-hidden bg-indigo-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Back</div>
                    <p className="font-medium text-lg text-indigo-50 leading-relaxed">{card.back}</p>
                </div>
            </motion.div>
        </div>
    );
};

function StudyKitContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const supabase = createSupabaseBrowserClient();
    const { isOpen, content, openShareModal, closeShareModal } = useShareModal();

    const [prompt, setPrompt] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoadingKit, setIsLoadingKit] = useState(false);
    const [studyKit, setStudyKit] = useState<any>(null);
    const [studyKits, setStudyKits] = useState<any[]>([]);
    const [isLoadingKits, setIsLoadingKits] = useState(false);
    const [user, setUser] = useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Quiz State moved to top level
    const [currentQuizStates, setCurrentQuizStates] = useState<any[]>([]);
    const [score, setScore] = useState<{ correct: number, total: number } | null>(null);

    // Pro features state
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesSpecification, setNotesSpecification] = useState('');
    const [showAdModal, setShowAdModal] = useState(false);
    const [adContentType, setAdContentType] = useState<'quizzes' | 'flashcards' | 'notes' | null>(null);
    const [adCountdown, setAdCountdown] = useState(5);
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [notesAdRewarded, setNotesAdRewarded] = useState(false);
    // --- NEW UPGRADE STATE ---
    const [kitMode, setKitMode] = useState<'single' | 'multi' | null>(null);
    const [multiSelectedTypes, setMultiSelectedTypes] = useState<string[]>([]);
    const [currentStep, setCurrentStep] = useState<'mode_selection' | 'menu' | 'multi_menu' | 'options' | 'confirm' | 'generating' | 'result'>('mode_selection');
    const [selectedStepType, setSelectedStepType] = useState<string | null>(null);
    const [countOption, setCountOption] = useState<number>(10);
    const [depthOption, setDepthOption] = useState<'summary' | 'deepdive' | 'coverage' | 'shi'>('coverage');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [activeChapter, setActiveChapter] = useState(0);
    const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
    // -------------------------

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const { isPremium } = useSubscription();

    // Fetch specific study kit if ID is present
    useEffect(() => {
        if (id) {
            fetchStudyKit(id);
        } else {
            fetchAllStudyKits();
        }
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
            if (data.studyKits) {
                setStudyKits(data.studyKits);
            }
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
            // Get kit info before deletion for tracking
            const deletedKit = studyKits.find(k => k.id === kitId);

            const response = await fetch(`/api/study-kit/${kitId}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setStudyKits(studyKits.filter(k => k.id !== kitId));

                // Track study kit deletion event
                posthog.capture('study_kit_deleted', {
                    kit_id: kitId,
                    kit_title: deletedKit?.title,
                    content_types: deletedKit?.content_types,
                });

                if (id === kitId) {
                    router.push('/tools/study-kit');
                }
            } else {
                alert(data.error || 'Failed to delete study kit');
            }
        } catch (err) {
            console.error('Error deleting study kit:', err);
            alert('Failed to delete study kit');
        }
    };

    const normalizeContent = (content: any, requestedTypes: string[] = []) => {
        console.log('🔍 Starting normalization with:', JSON.stringify(content, null, 2));

        const parseIfString = (data: any) => {
            if (typeof data !== 'string') return data;

            let sanitized = data.trim();

            // 1. Extract JSON from Markdown code blocks if present
            const jsonMatch = sanitized.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
            if (jsonMatch && jsonMatch[1]) {
                sanitized = jsonMatch[1].trim();
            }

            // 2. Try parsing directly
            try {
                return JSON.parse(sanitized);
            } catch (e) {
                // 3. Last ditch attempt: find the first { or [ and last } or ]
                const startIndex = sanitized.search(/[{\[]/);
                const endIndex = sanitized.lastIndexOf('}') > sanitized.lastIndexOf(']')
                    ? sanitized.lastIndexOf('}')
                    : sanitized.lastIndexOf(']');

                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    const extracted = sanitized.substring(startIndex, endIndex + 1);
                    try {
                        return JSON.parse(extracted);
                    } catch (innerE) {
                        console.error('Failed to parse extracted JSON:', innerE);
                    }
                }

                return sanitized;
            }
        };

        const normalized: any = {};

        // Initialize all requested types with default values to prevent validation failures
        requestedTypes.forEach(typeId => {
            if (typeId === 'quizzes' || typeId === 'flashcards') normalized[typeId] = [];
            else if (typeId === 'notes') normalized[typeId] = '';
            else if (typeId === 'mindmaps') normalized[typeId] = { central: 'Topic', branches: [] };
        });

        // Normalize quizzes
        if (content.quizzes) {
            const parsed = parseIfString(content.quizzes);
            console.log('📝 Quizzes parsed:', parsed);

            if (Array.isArray(parsed)) {
                normalized.quizzes = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                normalized.quizzes = parsed.questions;
            } else if (typeof parsed === 'object') {
                // Handle case where AI returns an object with a property that is an array
                const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
                if (arrayKey) {
                    normalized.quizzes = parsed[arrayKey];
                }
            }
        }

        // Normalize flashcards - handle both front/back and question/answer formats
        if (content.flashcards) {
            const parsed = parseIfString(content.flashcards);
            console.log('🎴 Flashcards parsed:', parsed);

            let cards = [];
            if (Array.isArray(parsed)) {
                cards = parsed;
            } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
                cards = parsed.flashcards;
            } else if (parsed.cards && Array.isArray(parsed.cards)) {
                cards = parsed.cards;
            }

            // Convert question/answer to front/back if needed
            normalized.flashcards = cards.map((card: any) => ({
                front: card.front || card.question || 'No content',
                back: card.back || card.answer || 'No content'
            }));
        }

        // Normalize notes - handle array of objects with heading/content
        if (content.notes) {
            const parsed = parseIfString(content.notes);
            console.log('📄 Notes parsed:', parsed);

            if (typeof parsed === 'string') {
                normalized.notes = parsed;
            } else if (parsed.notes && Array.isArray(parsed.notes)) {
                // Convert array of note objects to formatted string
                normalized.notes = parsed.notes.map((note: any) => {
                    let text = '';
                    if (note.heading) text += note.heading + '\n\n';
                    if (Array.isArray(note.content)) {
                        text += note.content.join('\n');
                    } else if (typeof note.content === 'string') {
                        text += note.content;
                    }
                    return text;
                }).join('\n\n---\n\n');
            } else if (Array.isArray(parsed)) {
                // Handle direct array of note objects
                normalized.notes = parsed.map((note: any) => {
                    let text = '';
                    if (note.heading) text += note.heading + '\n\n';
                    if (Array.isArray(note.content)) {
                        text += note.content.join('\n');
                    } else if (typeof note.content === 'string') {
                        text += note.content;
                    } else if (typeof note.content === 'object') {
                        text += JSON.stringify(note.content, null, 2);
                    }
                    return text;
                }).join('\n\n---\n\n');
            } else if (typeof parsed === 'object') {
                normalized.notes = JSON.stringify(parsed, null, 2);
                console.warn('⚠️ Notes was an object, converted to JSON string');
            } else {
                console.error('❌ Unexpected notes format:', parsed);
                normalized.notes = '';
            }
        }

        // Normalize mindmaps - handle title/children or title/nodes structure
        if (content.mindmaps) {
            const parsed = parseIfString(content.mindmaps);
            console.log('🗺️ Mindmaps parsed:', parsed);

            // Convert various structures to central/branches format
            if (parsed.title && (parsed.children || parsed.nodes)) {
                const branches = parsed.children || parsed.nodes;
                normalized.mindmaps = {
                    central: parsed.title,
                    branches: branches.map((node: any) => ({
                        topic: node.text || node.title || node.name,
                        subtopics: (node.children || []).map((c: any) => c.text || c.title || c.name),
                        details: node.details || node.description || ''
                    }))
                };
            } else if (parsed.central || parsed.center) {
                // Already in the correct format
                normalized.mindmaps = {
                    central: parsed.central || parsed.center,
                    branches: (parsed.branches || []).map((b: any) => ({
                        ...b,
                        details: b.details || ''
                    }))
                };
            } else {
                normalized.mindmaps = parsed;
            }
        }

        console.log('✅ After normalization:', normalized);
        return normalized;
    };

    const fetchStudyKit = async (kitId: string) => {
        setIsLoadingKit(true);
        try {
            const response = await fetch(`/api/study-kit/${kitId}`);
            const data = await response.json();

            if (data.studyKit) {
                const kit = data.studyKit;
                setStudyKit(kit);
                const normalized = normalizeContent(kit.generated_content, kit.content_types || []);
                console.log('Normalized content:', normalized);
                setGeneratedContent(normalized);
                setSelectedTypes(kit.content_types || []);
                setActiveTab(kit.content_types?.[0] || null);

                if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                    setCurrentQuizStates(normalized.quizzes.map(() => ({
                        selectedOption: null,
                        isConfirmed: false
                    })));
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

    const toggleContentType = (id: string) => {
        // Multi-select is now replaced by single select in the new flow
        setSelectedStepType(id);
        setCurrentStep('options');
    };

    const toggleMultiType = (id: string) => {
        setMultiSelectedTypes(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
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
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleBrowseClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError('');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.size > MAX_FILE_SIZE) {
                setError('File size exceeds 10MB. Please upload in smaller batches or reduce file size.');
                return;
            }
            setUploadedFile(file);
        }
    };

    const handleGenerate = async () => {
        const types = kitMode === 'multi' ? multiSelectedTypes : (selectedStepType ? [selectedStepType] : []);
        if ((!prompt.trim() && !uploadedFile) || types.length === 0 || isGenerating) return;

        setIsGenerating(true);
        setCurrentStep('generating');
        setGeneratedContent(null); // Clear old content
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
                fileData = {
                    name: uploadedFile.name,
                    type: uploadedFile.type,
                    content: content
                };
            }

            const response = await fetch('/api/study-kit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    contentTypes: types,
                    itemCount: countOption,
                    notesDepth: depthOption,
                    fileName: uploadedFile?.name,
                    fileContent: fileData?.content,
                    fileType: fileData?.type
                }),
            });

            const data = await response.json();

            if (data.success) {
                console.log('Raw API response:', data.content);
                const normalized = normalizeContent(data.content, types);
                console.log('After normalization in handleGenerate:', normalized);

                // Track study kit generation event
                posthog.capture('study_kit_generated', {
                    prompt: prompt,
                    content_types: types,
                    item_count: countOption,
                    notes_depth: depthOption,
                    has_file: !!uploadedFile,
                    kit_mode: kitMode
                });

                // Use setTimeout to ensure state update happens after current render cycle
                setTimeout(() => {
                    setSelectedTypes(types);
                    setGeneratedContent(normalized);
                    setActiveTab(types[0]);
                    setCurrentStep('result');

                    // Initialize quiz states if quizzes are generated
                    if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                        setCurrentQuizStates(normalized.quizzes.map(() => ({
                            selectedOption: null,
                            isConfirmed: false
                        })));
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

    const handleBackToCreate = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/tools/study-kit');
        }
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
                    studyKitId: studyKit.id,
                    contentType,
                    existingContent: Array.isArray(existingContent) ? existingContent : undefined,
                    notesSpecification: notesSpec || notesSpecification,
                    isAdReward,
                }),
            });

            const data = await response.json();

            if (data.success) {
                posthog.capture('study_kit_generate_more', {
                    kit_id: studyKit.id,
                    content_type: contentType,
                    new_items_count: Array.isArray(data.newContent) ? data.newContent.length : 1,
                });

                setGeneratedContent((prev: any) => ({
                    ...prev,
                    [contentType]: data.updatedContent
                }));

                setStudyKit((prev: any) => ({
                    ...prev,
                    generated_content: {
                        ...prev.generated_content,
                        [contentType]: data.updatedContent
                    }
                }));

                if (contentType === 'quizzes' && Array.isArray(data.updatedContent)) {
                    setCurrentQuizStates(data.updatedContent.map(() => ({
                        selectedOption: null,
                        isConfirmed: false
                    })));
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

    const renderModeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.button
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setKitMode('single');
                    setCurrentStep('menu');
                }}
                className="bg-zinc-900/50 border-2 border-zinc-800 hover:border-indigo-500 p-8 rounded-3xl text-left group transition-all"
            >
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-all">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Option 1: Guided Study</h3>
                <p className="text-zinc-500">Pick one tool and follow a guided flow to generate specific content.</p>
                <div className="mt-6 flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    Get Started <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
            </motion.button>

            <motion.button
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setKitMode('multi');
                    setCurrentStep('multi_menu');
                }}
                className="bg-zinc-900/50 border-2 border-zinc-800 hover:border-indigo-500 p-8 rounded-3xl text-left group transition-all"
            >
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all">
                    <Crown className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Option 2: Multi-Kit</h3>
                <p className="text-zinc-500">Select multiple tools at once to build a comprehensive study suite.</p>
                <div className="mt-6 flex items-center gap-2 text-purple-400 font-bold text-sm">
                    Build Everything <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
            </motion.button>
        </div>
    );

    const renderMultiMenu = () => (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <button onClick={() => setCurrentStep('mode_selection')} className="text-zinc-500 hover:text-white flex items-center gap-2 mx-auto mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Mode Selection
                </button>
                <h2 className="text-3xl font-bold">Select Your Tools</h2>
                <p className="text-zinc-400">Choose all the tools you want in your multi-kit</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = multiSelectedTypes.includes(type.id);
                    return (
                        <button
                            key={type.id}
                            onClick={() => toggleMultiType(type.id)}
                            className={`group p-6 rounded-2xl border-2 transition-all text-left ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500/5'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${isSelected ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">{type.label}</h3>
                                        <p className="text-zinc-400 text-sm">{type.description}</p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700'
                                    }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={() => setCurrentStep('options')}
                    disabled={multiSelectedTypes.length === 0}
                    className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 rounded-xl font-bold transition-all shadow-xl shadow-indigo-950/50"
                >
                    Continue to Setup
                </button>
            </div>
        </div>
    );

    const renderMenu = () => (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <button onClick={() => setCurrentStep('mode_selection')} className="text-zinc-500 hover:text-white flex items-center gap-2 mx-auto mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Mode Selection
                </button>
                <h2 className="text-3xl font-bold">What would you like to create?</h2>
                <p className="text-zinc-400">Select a study tool to get started</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.id}
                            onClick={() => toggleContentType(type.id)}
                            className="group p-6 rounded-2xl border-2 border-zinc-800 bg-zinc-900/50 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-zinc-800 group-hover:bg-indigo-500/20 transition-colors">
                                    <Icon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-1 group-hover:text-white">{type.label}</h3>
                                    <p className="text-zinc-400 text-sm">{type.description}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* My Study Kits List (Secondary) */}
            <div className="mt-12">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Library className="w-5 h-5 text-indigo-400" />
                    Recent Study Kits
                </h3>
                {isLoadingKits ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                    </div>
                ) : studyKits.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8 border border-dashed border-zinc-700 rounded-xl">
                        No kits yet. Create your first one above!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {studyKits.slice(0, 4).map((kit) => (
                            <div
                                key={kit.id}
                                className="group relative p-4 bg-zinc-800/30 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all cursor-pointer"
                                onClick={() => window.location.href = `/tools/study-kit?id=${kit.id}`}
                            >
                                <div className="pr-10">
                                    <h4 className="font-semibold text-white truncate">{kit.title}</h4>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {new Date(kit.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteStudyKit(e, kit.id)}
                                    className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderOptions = () => {
        const types = kitMode === 'multi' ? multiSelectedTypes : (selectedStepType ? [selectedStepType] : []);
        const hasQuizzes = types.includes('quizzes');
        const hasFlashcards = types.includes('flashcards');
        const hasNotes = types.includes('notes');
        const hasMindMap = types.includes('mindmaps');

        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center mb-8">
                    <button onClick={() => setCurrentStep(kitMode === 'multi' ? 'multi_menu' : 'menu')} className="text-zinc-500 hover:text-white flex items-center gap-2 mx-auto mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Selection
                    </button>
                    <h2 className="text-3xl font-bold">Configure Your Kit</h2>
                    <p className="text-zinc-400">Set preferences for your selected tools</p>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-8 space-y-8">
                    {/* Count Options for Quizzes/Flashcards */}
                    {(hasQuizzes || hasFlashcards) && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-4 text-center uppercase tracking-widest">
                                {kitMode === 'multi' ? 'Item Count (for Quizzes & Flashcards)' : 'How many items?'}
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {[10, 20, 30, 40, 50].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setCountOption(num)}
                                        className={`py-4 rounded-xl border-2 transition-all font-bold ${countOption === num
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                            : 'border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Depth Options for Notes */}
                    {hasNotes && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-4 text-center uppercase tracking-widest">Select Notes Depth</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { id: 'summary', name: 'Summary', desc: 'High-level overview' },
                                    { id: 'deepdive', name: 'Deep Dive', desc: 'Detailed explanations' },
                                    { id: 'coverage', name: 'Coverage', desc: 'Balanced breadth & depth' },
                                    { id: 'shi', name: 'Shi', desc: 'Experimental & Creative' }
                                ].map((depth: any) => (
                                    <button
                                        key={depth.id}
                                        onClick={() => setDepthOption(depth.id)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${depthOption === depth.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`font-bold ${depthOption === depth.id ? 'text-indigo-400' : 'text-white'}`}>{depth.name}</span>
                                            {depthOption === depth.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <p className="text-xs text-zinc-500">{depth.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasMindMap && !hasQuizzes && !hasFlashcards && !hasNotes && (
                        <div className="text-center py-4">
                            <p className="text-zinc-400">Mind maps generate a single interactive visualization.</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            onClick={() => setCurrentStep('confirm')}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderConfirm = () => {
        const types = kitMode === 'multi' ? multiSelectedTypes : (selectedStepType ? [selectedStepType] : []);
        return (
            <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center mb-8">
                    <button onClick={() => setCurrentStep('options')} className="text-zinc-500 hover:text-white flex items-center gap-2 mx-auto mb-4">
                        <ArrowLeft className="w-4 h-4" /> Back to Setup
                    </button>
                    <h2 className="text-3xl font-bold">Ready to Generate?</h2>
                    <p className="text-zinc-400 mt-2">Finalize your input and confirm the study kit generation.</p>
                </div>

                <div className="space-y-6">
                    {/* Prompt Input */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Topic or PDF Context</h3>

                        {uploadedFile ? (
                            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                    <div className="text-left">
                                        <p className="font-medium text-white truncate max-w-[200px]">{uploadedFile.name}</p>
                                        <p className="text-xs text-zinc-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button onClick={() => setUploadedFile(null)} className="p-2 hover:bg-zinc-800 rounded-lg">
                                    <X className="w-4 h-4 text-zinc-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Enter topic here..."
                                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-700 resize-none focus:outline-none focus:border-indigo-500 transition"
                                />
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 py-3 border border-dashed border-zinc-800 hover:border-indigo-500 text-zinc-500 hover:text-indigo-400 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Upload className="w-4 h-4" /> Upload Material
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Card */}
                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col items-center text-center">
                        <Sparkles className="w-8 h-8 text-indigo-400 mb-3" />
                        <div className="text-zinc-300">
                            I will generate:
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                {types.map(t => (
                                    <span key={t} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <p className="mt-4 text-sm">
                                {types.includes('notes') && `Notes Depth: ${depthOption}`}
                                {types.some(t => t && ['quizzes', 'flashcards'].includes(t)) && ` • Items: ${countOption}`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={(!prompt.trim() && !uploadedFile) || isGenerating}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-950/50 transition-all flex items-center justify-center gap-3"
                    >
                        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        Generate Study Kit
                    </button>
                </div>
            </div>
        );
    };

    const renderGenerating = () => (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[40px] animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
            </div>
            <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse">
                    Crafting your study materials...
                </h2>
                <p className="text-zinc-500 mt-2">This may take a minute depending on the number of tools selected.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {['Reading materials...', 'Structuring concepts...', 'Polishing results...'].map((txt, i) => (
                    <div key={i} className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                        <span className="text-xs text-zinc-400">{txt}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8">
                    {id && studyKit ? (
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBackToCreate}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                                >
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

                {/* Generation Interface */}
                {!generatedContent && !id ? (
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            {currentStep === 'mode_selection' && (
                                <motion.div
                                    key="mode_selection"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {renderModeSelection()}
                                </motion.div>
                            )}

                            {currentStep === 'menu' && (
                                <motion.div
                                    key="menu"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {renderMenu()}
                                </motion.div>
                            )}

                            {currentStep === 'multi_menu' && (
                                <motion.div
                                    key="multi_menu"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {renderMultiMenu()}
                                </motion.div>
                            )}

                            {currentStep === 'options' && (
                                <motion.div
                                    key="options"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {renderOptions()}
                                </motion.div>
                            )}

                            {currentStep === 'confirm' && (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    {renderConfirm()}
                                </motion.div>
                            )}

                            {currentStep === 'generating' && (
                                <motion.div
                                    key="generating"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {renderGenerating()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : generatedContent ? (
                    <div className="space-y-6">
                        {/* Generated Results View */}
                        {/* Success message if some failed but others succeeded */}
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
                                        Note: Some content types couldn't be generated perfectly and were skipped.
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {/* Tabs */}
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
                                    onClick={() => setGeneratedContent(null)}
                                    className="ml-auto px-4 py-2 text-zinc-500 hover:text-white transition flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Create New
                                </button>
                            )}
                        </div>

                        {/* Content Display */}
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
                            {/* Generate More / Ad Buttons - Top of Content */}
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
                                                    <Sparkles className="w-3 h-3" />
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
                                                    {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    Ad for 10 Quizzes
                                                </button>
                                                <button
                                                    onClick={() => handleWatchAd('flashcards')}
                                                    disabled={isGeneratingMore}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-xs transition-all"
                                                >
                                                    {isGeneratingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                    Ad for 10 Flashcards
                                                </button>
                                                <button
                                                    onClick={() => handleWatchAd('notes')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold text-xs transition-all"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    Ad for Custom Notes
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <AnimatePresence mode="wait">

                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === 'quizzes' && generatedContent.quizzes && (
                                        <div className="grid gap-6">
                                            {(() => {
                                                const handleOptionSelect = (quizIndex: number, optionIndex: number) => {
                                                    if (currentQuizStates[quizIndex]?.isConfirmed) return;

                                                    const newStates = [...currentQuizStates];
                                                    newStates[quizIndex] = { ...newStates[quizIndex], selectedOption: optionIndex };
                                                    setCurrentQuizStates(newStates);
                                                };

                                                const handleConfirm = (quizIndex: number) => {
                                                    const newStates = [...currentQuizStates];
                                                    newStates[quizIndex] = { ...newStates[quizIndex], isConfirmed: true };
                                                    setCurrentQuizStates(newStates);

                                                    // Update score if all are confirmed
                                                    if (newStates.every(s => s.isConfirmed)) {
                                                        const correctCount = newStates.reduce((acc, s, idx) => {
                                                            return acc + (s.selectedOption === generatedContent.quizzes[idx].correctAnswer ? 1 : 0);
                                                        }, 0);
                                                        setScore({ correct: correctCount, total: generatedContent.quizzes.length });
                                                    }
                                                };

                                                let quizData = generatedContent.quizzes;
                                                if (!Array.isArray(quizData) && quizData.questions) quizData = quizData.questions;
                                                if (!Array.isArray(quizData) || quizData.length === 0) return <div className="p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">No quizzes available</div>;

                                                return (
                                                    <>
                                                        {score && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="bg-indigo-600 rounded-xl p-6 text-center mb-6"
                                                            >
                                                                <h4 className="text-2xl font-bold mb-2">Quiz Complete!</h4>
                                                                <p className="text-indigo-100 text-lg">Your Score: {score.correct} / {score.total} ({Math.round((score.correct / score.total) * 100)}%)</p>
                                                            </motion.div>
                                                        )}
                                                        {quizData.map((quiz: any, i: number) => {
                                                            const state = currentQuizStates[i];
                                                            const isCorrect = state?.selectedOption === quiz.correctAnswer;
                                                            const showExplanation = state?.isConfirmed;

                                                            return (
                                                                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <h3 className="font-bold text-lg flex gap-3">
                                                                            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                                                                {i + 1}
                                                                            </span>
                                                                            {quiz.question}
                                                                        </h3>
                                                                        {quiz.difficulty && (
                                                                            <span className={`text-xs px-2 py-1 rounded-full ${quiz.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400' :
                                                                                quiz.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                                                                    'bg-green-500/10 text-green-400'
                                                                                }`}>
                                                                                {quiz.difficulty}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2 pl-11">
                                                                        {quiz.options?.map((opt: string, optIndex: number) => {
                                                                            const isSelected = state?.selectedOption === optIndex;
                                                                            const isAnswer = optIndex === quiz.correctAnswer;

                                                                            let borderColor = 'border-zinc-800';
                                                                            let bgColor = 'bg-zinc-950/50';

                                                                            if (state?.isConfirmed) {
                                                                                if (isAnswer) {
                                                                                    borderColor = 'border-green-500';
                                                                                    bgColor = 'bg-green-500/10';
                                                                                } else if (isSelected && !isCorrect) {
                                                                                    borderColor = 'border-red-500';
                                                                                    bgColor = 'bg-red-500/10';
                                                                                }
                                                                            } else if (isSelected) {
                                                                                borderColor = 'border-indigo-500';
                                                                                bgColor = 'bg-indigo-500/10';
                                                                            }

                                                                            return (
                                                                                <button
                                                                                    key={optIndex}
                                                                                    disabled={state?.isConfirmed}
                                                                                    onClick={() => handleOptionSelect(i, optIndex)}
                                                                                    className={`w-full text-left p-3 rounded-lg border transition ${borderColor} ${bgColor} ${!state?.isConfirmed && 'hover:border-zinc-600'}`}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                        {!state?.isConfirmed && state?.selectedOption !== null && (
                                                                            <button
                                                                                onClick={() => handleConfirm(i)}
                                                                                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition"
                                                                            >
                                                                                Check Answer
                                                                            </button>
                                                                        )}
                                                                        {showExplanation && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                className="mt-4 p-4 bg-zinc-800/50 rounded-lg text-sm border-l-4 border-indigo-500"
                                                                            >
                                                                                <p className="font-bold text-indigo-400 mb-1">Explanation:</p>
                                                                                <p className="text-zinc-300">{quiz.explanation}</p>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                );
                                            })()}

                                            {/* Generate More Quizzes Button - Always Visible */}
                                            {studyKit && (
                                                <div className="mt-6 flex justify-center">
                                                    {isPremium ? (
                                                        <button
                                                            onClick={() => handleGenerateMore('quizzes')}
                                                            disabled={isGeneratingMore}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                        >
                                                            {isGeneratingMore ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Crown className="w-4 h-4" />
                                                                    <Plus className="w-4 h-4" />
                                                                    Generate 10 More Quizzes
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleWatchAd('quizzes')}
                                                            disabled={isGeneratingMore}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                        >
                                                            {isGeneratingMore ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Watch Ad for 10 More Quizzes
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'flashcards' && generatedContent.flashcards && (
                                        <div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {(() => {
                                                    let flashcardData = generatedContent.flashcards;
                                                    if (!Array.isArray(flashcardData)) {
                                                        if (flashcardData.flashcards) flashcardData = flashcardData.flashcards;
                                                        else if (flashcardData.cards) flashcardData = flashcardData.cards;
                                                    }
                                                    if (!Array.isArray(flashcardData) || flashcardData.length === 0) return <div className="col-span-full p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">No flashcards available</div>;

                                                    return flashcardData.map((card: any, i: number) => (
                                                        <FlashcardItem key={i} card={card} />
                                                    ));
                                                })()}
                                            </div>

                                            {/* Generate More Flashcards Button - Always Visible */}
                                            {studyKit && (
                                                <div className="mt-6 flex justify-center">
                                                    {isPremium ? (
                                                        <button
                                                            onClick={() => handleGenerateMore('flashcards')}
                                                            disabled={isGeneratingMore}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                        >
                                                            {isGeneratingMore ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Crown className="w-4 h-4" />
                                                                    <Plus className="w-4 h-4" />
                                                                    Generate 10 More Flashcards
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleWatchAd('flashcards')}
                                                            disabled={isGeneratingMore}
                                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                        >
                                                            {isGeneratingMore ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Generating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Watch Ad for 10 More Flashcards
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'notes' && generatedContent.notes && (
                                        <div className="space-y-6">
                                            {/* Notes Header */}
                                            <div className="bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-purple-950/50 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                                                            <FileText className="w-6 h-6 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-white">Study Notes</h3>
                                                            <p className="text-sm text-zinc-400">AI-generated comprehensive notes</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const notesText = typeof generatedContent.notes === 'string'
                                                                ? generatedContent.notes
                                                                : JSON.stringify(generatedContent.notes, null, 2);
                                                            navigator.clipboard.writeText(notesText);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Copy All
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Notes Content */}
                                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                                                {/* Decorative top bar */}
                                                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                                                <div className="p-6 sm:p-10">
                                                    <article className="prose prose-invert max-w-none 
                                                        prose-headings:font-extrabold prose-headings:tracking-tight
                                                        prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-8 prose-h1:pb-6 prose-h1:border-b-2 prose-h1:border-indigo-500/30 prose-h1:bg-gradient-to-r prose-h1:from-white prose-h1:to-indigo-200 prose-h1:bg-clip-text prose-h1:text-transparent
                                                        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-indigo-400 prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:before:content-[''] prose-h2:before:w-1 prose-h2:before:h-6 prose-h2:before:bg-indigo-500 prose-h2:before:rounded-full
                                                        prose-h3:text-xl prose-h3:text-zinc-100 prose-h3:mt-10 prose-h3:mb-4 prose-h3:font-bold
                                                        prose-h4:text-lg prose-h4:text-zinc-200 prose-h4:mt-6 prose-h4:mb-3
                                                        prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-4 prose-p:text-base
                                                        prose-li:text-zinc-300 prose-li:my-2 prose-li:marker:text-indigo-400
                                                        prose-ul:my-4 prose-ul:space-y-1
                                                        prose-ol:my-4 prose-ol:space-y-1
                                                        prose-strong:text-indigo-300 prose-strong:font-bold
                                                        prose-em:text-purple-300 prose-em:not-italic prose-em:bg-purple-500/10 prose-em:px-1 prose-em:rounded
                                                        prose-code:text-cyan-300 prose-code:bg-zinc-800/80 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-code:font-mono
                                                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl
                                                        prose-table:border-collapse prose-table:w-full prose-table:my-8
                                                        prose-thead:bg-indigo-950/50
                                                        prose-th:border prose-th:border-zinc-700 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-indigo-300 prose-th:font-bold prose-th:text-sm prose-th:uppercase prose-th:tracking-wider
                                                        prose-td:border prose-td:border-zinc-800 prose-td:px-4 prose-td:py-3 prose-td:text-zinc-300
                                                        prose-tr:even:bg-zinc-900/50
                                                        prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:my-6 prose-blockquote:not-italic prose-blockquote:text-indigo-200
                                                        prose-hr:border-zinc-800 prose-hr:my-12
                                                        prose-a:text-indigo-400 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-indigo-300
                                                        prose-img:rounded-2xl prose-img:shadow-xl
                                                    ">
                                                        <ReactMarkdown
                                                            components={{
                                                                h1: ({ children }) => (
                                                                    <h1 className="relative">
                                                                        <span className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                                                                        {children}
                                                                    </h1>
                                                                ),
                                                                h2: ({ children }) => (
                                                                    <h2 className="group">
                                                                        <span className="inline-block w-8 h-8 mr-3 bg-indigo-500/20 rounded-lg text-indigo-400 text-center leading-8 text-sm font-mono">§</span>
                                                                        {children}
                                                                    </h2>
                                                                ),
                                                                blockquote: ({ children }) => (
                                                                    <blockquote className="relative">
                                                                        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
                                                                        <Sparkles className="absolute -left-3 -top-3 w-5 h-5 text-indigo-400" />
                                                                        {children}
                                                                    </blockquote>
                                                                ),
                                                                ul: ({ children }) => (
                                                                    <ul className="space-y-2 my-4">
                                                                        {children}
                                                                    </ul>
                                                                ),
                                                                li: ({ children }) => (
                                                                    <li className="flex items-start gap-3">
                                                                        <span className="mt-2 w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                                                        <span>{children}</span>
                                                                    </li>
                                                                ),
                                                                table: ({ children }) => (
                                                                    <div className="overflow-x-auto my-8 rounded-xl border border-zinc-800">
                                                                        <table className="w-full">{children}</table>
                                                                    </div>
                                                                ),
                                                                code({ node, inline, className, children, ...props }: any) {
                                                                    const match = /language-(\w+)/.exec(className || '');
                                                                    const language = match ? match[1] : '';
                                                                    const content = String(children).replace(/\n$/, '');

                                                                    if (!inline && language) {
                                                                        return (
                                                                            <div className="relative group my-6 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
                                                                                <div className="bg-zinc-900 px-4 py-2 text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-700 flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="flex gap-1.5">
                                                                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                                                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                                                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                                                                        </div>
                                                                                        <span className="ml-2">{language}</span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => navigator.clipboard.writeText(content)}
                                                                                        className="text-zinc-500 hover:text-white transition flex items-center gap-1"
                                                                                    >
                                                                                        <Copy className="w-3 h-3" />
                                                                                        Copy
                                                                                    </button>
                                                                                </div>
                                                                                <SyntaxHighlighter
                                                                                    style={vscDarkPlus}
                                                                                    language={language}
                                                                                    PreTag="div"
                                                                                    className="!bg-zinc-950 !p-4 !m-0 custom-scrollbar"
                                                                                    {...props}
                                                                                >
                                                                                    {content}
                                                                                </SyntaxHighlighter>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <code className={`${className} bg-zinc-800/80 px-2 py-1 rounded-md text-cyan-300`} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {typeof generatedContent.notes === 'string'
                                                                ? generatedContent.notes
                                                                : Array.isArray(generatedContent.notes)
                                                                    ? generatedContent.notes.join('\n\n')
                                                                    : JSON.stringify(generatedContent.notes, null, 2)}
                                                        </ReactMarkdown>
                                                    </article>
                                                </div>

                                                {/* Decorative bottom */}
                                                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                                            </div>

                                            {/* Custom Notes Section - Always Visible */}
                                            {studyKit && (
                                                <div className="mt-6">
                                                    {!showNotesModal ? (
                                                        <div className="flex justify-center">
                                                            {isPremium ? (
                                                                <button
                                                                    onClick={() => setShowNotesModal(true)}
                                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                                >
                                                                    <Crown className="w-4 h-4" />
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Generate Custom Notes
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleWatchAd('notes')}
                                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold text-sm transition-all shadow-lg"
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                    Watch Ad for Custom Notes
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6"
                                                        >
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Crown className="w-5 h-5 text-amber-400" />
                                                                <h3 className="font-bold text-lg text-white">Generate Custom Notes</h3>
                                                            </div>
                                                            <p className="text-sm text-zinc-400 mb-4">
                                                                Specify exactly what you want in your notes - topics, depth, examples, format, etc.
                                                            </p>
                                                            <textarea
                                                                value={notesSpecification}
                                                                onChange={(e) => setNotesSpecification(e.target.value)}
                                                                placeholder="e.g., I need detailed notes on the causes and effects of the French Revolution, with a focus on economic factors. Include a timeline of key events and at least 3 primary source quotes..."
                                                                className="w-full h-32 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition resize-none"
                                                            />
                                                            <div className="flex items-center justify-end gap-3 mt-4">
                                                                <button
                                                                    onClick={() => {
                                                                        setShowNotesModal(false);
                                                                        setNotesSpecification('');
                                                                        setNotesAdRewarded(false);
                                                                    }}
                                                                    className="px-4 py-2 text-zinc-400 hover:text-white transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={() => handleGenerateMore('notes', undefined, notesAdRewarded)}
                                                                    disabled={!notesSpecification.trim() || isGeneratingMore}
                                                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-lg font-bold text-sm transition-all"
                                                                >
                                                                    {isGeneratingMore ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Generating...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Send className="w-4 h-4" />
                                                                            Generate Notes
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'mindmaps' && generatedContent.mindmaps && (
                                        <div className="space-y-6">
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-[600px] flex flex-col items-center shadow-2xl overflow-hidden relative touch-none">
                                                <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Interactive Map • Click Nodes for Details</span>
                                                </div>

                                                {(() => {
                                                    const data = generatedContent.mindmaps;
                                                    if (!data || (!data.central && !data.center)) return <div className="text-zinc-500">Generating visualization...</div>;

                                                    const centralTopic = data.central || (typeof data.center === 'object' ? data.center.topic : data.center);
                                                    const branches = data.branches || (typeof data.center === 'object' ? data.center.subtopics : []);

                                                    return (
                                                        <motion.div
                                                            drag
                                                            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                                            className="relative w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center p-20"
                                                        >
                                                            {/* Central Node */}
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="bg-indigo-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-3xl font-bold text-lg sm:text-2xl shadow-[0_0_50px_rgba(79,70,229,0.3)] z-50 relative border-2 border-indigo-400 text-center max-w-[200px] sm:max-w-none"
                                                            >
                                                                {centralTopic}
                                                            </motion.div>

                                                            {/* Branches */}
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                {branches.map((branch: any, i: number, arr: any[]) => {
                                                                    const angle = (i / arr.length) * 2 * Math.PI;
                                                                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                                                                    const radius = isMobile ? 220 : 300;
                                                                    const x = Math.cos(angle) * radius;
                                                                    const y = Math.sin(angle) * (radius * 0.7);

                                                                    const branchTopic = typeof branch === 'string' ? branch : branch.topic || branch.name;
                                                                    const subtopics = branch.subtopics || [];

                                                                    return (
                                                                        <motion.div
                                                                            key={i}
                                                                            initial={{ opacity: 0, x: 0, y: 0 }}
                                                                            animate={{ opacity: 1, x, y }}
                                                                            transition={{ delay: i * 0.1, duration: 0.8, type: 'spring' }}
                                                                            className="absolute flex flex-col items-center z-10 pointer-events-auto"
                                                                        >
                                                                            <button
                                                                                onClick={() => setSelectedNodeData(branch)}
                                                                                className="bg-zinc-950 border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl w-40 sm:w-56 hover:border-indigo-500 hover:bg-zinc-900 transition-all group text-left"
                                                                            >
                                                                                <h5 className="font-bold text-[11px] sm:text-sm text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">{branchTopic}</h5>
                                                                                {subtopics.length > 0 && (
                                                                                    <div className="space-y-1">
                                                                                        {subtopics.slice(0, 3).map((s: string, idx: number) => (
                                                                                            <div key={idx} className="text-[9px] sm:text-[10px] text-zinc-400 flex items-center gap-1">
                                                                                                <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0"></span>
                                                                                                <span className="line-clamp-1">{s}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                                {branch.details && (
                                                                                    <div className="mt-2 flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">
                                                                                        <Plus className="w-2.5 h-2.5" /> View Details
                                                                                    </div>
                                                                                )}
                                                                            </button>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Decorative Background Glows */}
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -z-10"></div>
                                                        </motion.div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Node Details Panel */}
                                            <AnimatePresence>
                                                {selectedNodeData && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-zinc-900 border-2 border-indigo-500/30 rounded-2xl overflow-hidden"
                                                    >
                                                        <div className="p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-xl font-bold text-white">{selectedNodeData.topic}</h4>
                                                                <button
                                                                    onClick={() => setSelectedNodeData(null)}
                                                                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="space-y-4">
                                                                    <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Key Points</h5>
                                                                    <ul className="space-y-2">
                                                                        {selectedNodeData.subtopics?.map((s: string, i: number) => (
                                                                            <li key={i} className="flex items-start gap-3 text-zinc-300">
                                                                                <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                                                {s}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400">In-Depth Details</h5>
                                                                    <p className="text-zinc-300 leading-relaxed bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                                                                        {selectedNodeData.details || "No additional details available for this topic."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Share Modal */}
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

            {/* Ad Modal for Free Users */}
            <AnimatePresence>
                {showAdModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !isWatchingAd && setShowAdModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-md w-full text-center"
                        >
                            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-8 h-8 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Unlock More Content</h3>
                            <p className="text-zinc-400 mb-6">
                                Watch a short ad to generate more {adContentType === 'notes' ? 'custom notes' : adContentType}
                            </p>

                            {/* AdSense Script for Verification */}
                            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7134321558578802"
                                crossOrigin="anonymous"></script>

                            {/* Simulated Ad Placeholder */}
                            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6 mb-6">
                                <div className="text-xs uppercase tracking-widest text-indigo-400 mb-3">Sponsored</div>
                                <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
                                    <Crown className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-white">Upgrade to Premium</p>
                                    <p className="text-xs text-zinc-400 mt-1">Remove ads & get unlimited generations</p>
                                </div>
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                                >
                                    Learn More →
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAdModal(false)}
                                    disabled={isWatchingAd}
                                    className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-xl transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdComplete}
                                    disabled={isWatchingAd}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    {isWatchingAd ? `Wait ${adCountdown}s...` : 'Continue'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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