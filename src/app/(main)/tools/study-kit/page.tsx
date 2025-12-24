'use client';

import { useState, useEffect, Suspense } from 'react';
import { Upload, FileText, Brain, Zap, Map, CheckCircle2, Loader2, X, ArrowLeft, Trash2, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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

    // Quiz State moved to top level
    const [currentQuizStates, setCurrentQuizStates] = useState<any[]>([]);
    const [score, setScore] = useState<{ correct: number, total: number } | null>(null);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
            const response = await fetch(`/api/study-kit/${kitId}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (data.success) {
                setStudyKits(studyKits.filter(k => k.id !== kitId));
                if (id === kitId) {
                    window.location.href = '/tools/study-kit';
                }
            } else {
                alert(data.error || 'Failed to delete study kit');
            }
        } catch (err) {
            console.error('Error deleting study kit:', err);
            alert('Failed to delete study kit');
        }
    };

    const normalizeContent = (content: any) => {
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

        // Normalize quizzes
        if (content.quizzes) {
            const parsed = parseIfString(content.quizzes);
            console.log('📝 Quizzes parsed:', parsed);

            if (Array.isArray(parsed)) {
                normalized.quizzes = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                normalized.quizzes = parsed.questions;
            } else {
                console.error('❌ Unexpected quizzes format:', parsed);
                normalized.quizzes = [];
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
                        subtopics: (node.children || []).map((c: any) => c.text || c.title || c.name)
                    }))
                };
            } else if (parsed.central || parsed.center) {
                // Already in the correct format
                normalized.mindmaps = parsed;
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
            const response = await fetch('/api/study-kit/list');
            const data = await response.json();

            if (data.studyKits) {
                const kit = data.studyKits.find((k: any) => k.id === kitId);
                if (kit) {
                    setStudyKit(kit);
                    const normalized = normalizeContent(kit.generated_content);
                    console.log('Normalized content:', normalized);
                    setGeneratedContent(normalized);
                    setSelectedTypes(kit.content_types || []);
                    setActiveTab(kit.content_types?.[0] || null);

                    // Initialize quiz states for loaded kit
                    if (normalized.quizzes && Array.isArray(normalized.quizzes)) {
                        setCurrentQuizStates(normalized.quizzes.map(() => ({
                            selectedOption: null,
                            isConfirmed: false
                        })));
                        setScore(null);
                    }
                } else {
                    setError('Study kit not found');
                }
            }
        } catch (err) {
            console.error('Error fetching study kit:', err);
            setError('Failed to load study kit');
        } finally {
            setIsLoadingKit(false);
        }
    };

    const toggleContentType = (id: string) => {
        setSelectedTypes(prev =>
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
        if ((!prompt.trim() && !uploadedFile) || selectedTypes.length === 0) return;

        setIsGenerating(true);
        setGeneratedContent(null); // Clear old content
        setActiveTab(null);

        try {
            let contentPrompt = prompt;
            if (uploadedFile) {
                contentPrompt += ` [File: ${uploadedFile.name}]`;
            }

            const response = await fetch('/api/study-kit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: contentPrompt,
                    contentTypes: selectedTypes,
                    fileName: uploadedFile?.name
                }),
            });

            const data = await response.json();

            if (data.success) {
                console.log('Raw API response:', data.content);
                const normalized = normalizeContent(data.content);
                console.log('After normalization in handleGenerate:', normalized);

                // Use setTimeout to ensure state update happens after current render cycle
                setTimeout(() => {
                    setGeneratedContent(normalized);
                    setActiveTab(selectedTypes[0]);

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
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert('Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBackToCreate = () => {
        window.location.href = '/tools/study-kit';
    };

    // Loading state when fetching a specific kit
    if (id && isLoadingKit) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="text-center relative z-10">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
                    <p className="text-zinc-400">Loading study kit...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (id && error && !studyKit) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="text-center max-w-md relative z-10">
                    <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Study Kit Not Found</h2>
                    <p className="text-zinc-400 mb-6">{error}</p>
                    <button
                        onClick={handleBackToCreate}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Create
                    </button>
                </div>
            </div>
        );
    }

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

                {/* Generation Interface (only show if no ID or if viewing generated content) */}
                {!generatedContent && !id ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Input */}
                        <div className="space-y-6">
                            {/* Text Prompt */}
                            <div className="border-2 border-zinc-700 bg-zinc-900/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    Enter Topic or Prompt
                                </h2>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., Photosynthesis in plants, World War II timeline, Python data structures..."
                                    className="w-full h-40 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div className="border-2 border-zinc-700 bg-zinc-900/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-indigo-400" />
                                    Or Upload Material
                                </h2>

                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    {uploadedFile ? (
                                        <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-8 h-8 text-indigo-400" />
                                                <div className="text-left">
                                                    <p className="font-medium text-white">{uploadedFile.name}</p>
                                                    <p className="text-sm text-zinc-400">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setUploadedFile(null)}
                                                className="p-2 hover:bg-zinc-700 rounded-lg transition"
                                            >
                                                <X className="w-5 h-5 text-zinc-400" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                                            <p className="text-zinc-400 mb-2">Drag & drop your file here</p>
                                            <p className="text-sm text-zinc-500 mb-4">Supports PDF, PPTX, DOCX, images • Max 10MB</p>
                                            <label className="inline-block px-6 py-2 border border-zinc-700 hover:border-indigo-500 rounded-lg cursor-pointer transition">
                                                <span className="text-zinc-300">Browse Files</span>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.md,.csv"
                                                    className="hidden"
                                                />
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Options */}
                        <div className="space-y-6">
                            {/* Content Type Selection */}
                            <div className="border-2 border-zinc-700 bg-zinc-900/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">Select Content Types</h2>
                                <p className="text-sm text-zinc-400 mb-6">Choose what you want to generate (select multiple)</p>

                                <div className="space-y-3">
                                    {contentTypes.map((type) => {
                                        const Icon = type.icon;
                                        const isSelected = selectedTypes.includes(type.id);
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => toggleContentType(type.id)}
                                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-600/10'
                                                    : 'border-zinc-700 hover:border-zinc-600'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20' : 'bg-zinc-800'}`}>
                                                        <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className="font-semibold text-white">{type.label}</h3>
                                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                                                        </div>
                                                        <p className="text-sm text-zinc-400">{type.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={(!prompt.trim() && !uploadedFile) || selectedTypes.length === 0 || isGenerating}
                                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Generating Your Kit...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-6 h-6" />
                                        Generate Study Kit
                                    </>
                                )}
                            </button>

                            {selectedTypes.length === 0 && (
                                <p className="text-sm text-center text-zinc-500">Select at least one content type to continue</p>
                            )}

                            {/* My Study Kits List */}
                            <div className="border-2 border-zinc-700 bg-zinc-900/30 rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Library className="w-5 h-5 text-indigo-400" />
                                    My Study Kits
                                </h2>
                                
                                {isLoadingKits ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                                    </div>
                                ) : studyKits.length === 0 ? (
                                    <p className="text-sm text-zinc-500 text-center py-8 bg-zinc-800/30 rounded-lg border border-dashed border-zinc-700">
                                        You haven't generated any study kits yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {studyKits.map((kit) => (
                                            <div 
                                                key={kit.id}
                                                className="group relative p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 hover:border-indigo-500 transition-all cursor-pointer"
                                                onClick={() => window.location.href = `/tools/study-kit?id=${kit.id}`}
                                            >
                                                <div className="pr-10">
                                                    <h3 className="font-semibold text-white truncate">{kit.title}</h3>
                                                    <p className="text-xs text-zinc-400 mt-1">
                                                        {new Date(kit.created_at).toLocaleDateString()} • {kit.content_types?.length || 0} types
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteStudyKit(e, kit.id)}
                                                    className="absolute bottom-2 right-2 p-2 bg-zinc-900/90 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full border border-zinc-700 hover:border-red-500 transition-all shadow-lg z-10"
                                                    title="Delete Kit"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : generatedContent ? (
                    // Generated Results View
                    <div className="space-y-6">
                        {/* Only render if generatedContent is properly normalized */}
                        {(() => {
                            // Safety check - ensure content types are properly formatted
                            const hasValidData = selectedTypes.every(typeId => {
                                const data = generatedContent[typeId];
                                if (!data) return false;

                                // For arrays, check they're actually arrays
                                if (typeId === 'quizzes' || typeId === 'flashcards') {
                                    return Array.isArray(data);
                                }

                                // For notes and mindmaps, any truthy value is ok
                                return true;
                            });

                            if (!hasValidData) {
                                console.error('Invalid data detected:', generatedContent);
                                return (
                                    <div className="p-8 bg-zinc-900 rounded-xl text-center">
                                        <p className="text-zinc-400 mb-4">Data validation failed. Please try regenerating.</p>
                                        <button
                                            onClick={() => setGeneratedContent(null)}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                );
                            }

                            return null; // Data is valid, continue rendering
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
                                        </div>
                                    )}

                                    {activeTab === 'flashcards' && generatedContent.flashcards && (
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
                                    )}

                                    {activeTab === 'notes' && generatedContent.notes && (
                                        <div className="bg-gray-800 border border-zinc-700 rounded-2xl p-8 lg:p-12 shadow-2xl">
                                            <div className="prose prose-invert prose-indigo max-w-none">
                                                {(() => {
                                                    let notesContent = generatedContent.notes;
                                                    if (typeof notesContent === 'object' && !Array.isArray(notesContent)) {
                                                        notesContent = notesContent.notes || JSON.stringify(notesContent, null, 2);
                                                    } else if (Array.isArray(notesContent)) {
                                                        notesContent = notesContent.join('\n\n');
                                                    }

                                                    if (typeof notesContent !== 'string') return <div className="text-zinc-400">Invalid notes format</div>;

                                                    // Use a simpler approach for internal HTML rendering to avoid overly complex regex
                                                    return (
                                                        <div className="text-zinc-200 leading-relaxed space-y-6 whitespace-pre-wrap">
                                                            {notesContent.split('\n').map((line, idx) => {
                                                                if (line.startsWith('# ')) return <h1 key={idx} className="text-4xl font-bold text-white mb-6 border-b border-zinc-800 pb-4">{line.replace('# ', '')}</h1>;
                                                                if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold text-indigo-400 mt-10 mb-4">{line.replace('## ', '')}</h2>;
                                                                if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold text-white mt-8 mb-3">{line.replace('### ', '')}</h3>;
                                                                if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx} className="ml-4 text-zinc-300">{line.replace(/^[-*] /, '')}</li>;
                                                                if (line.trim() === '') return <div key={idx} className="h-2" />;
                                                                return <p key={idx} className="text-zinc-300">{line}</p>;
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'mindmaps' && generatedContent.mindmaps && (
                                        <div className="bg-gray-800 border border-zinc-700 rounded-2xl h-[600px] flex flex-col items-center shadow-2xl overflow-hidden relative touch-none">
                                            <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Interactive Map • Drag to Pan</span>
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
                                                                // Adjust radius based on screen size
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
                                                                        <div className="bg-gray-900 border border-zinc-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl w-40 sm:w-56 hover:border-indigo-500 transition-colors group">
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
                                                                        </div>
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