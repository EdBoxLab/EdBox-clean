'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Brain, Zap, Map, CheckCircle2, Loader2, X, ChevronRight, Copy, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

const contentTypes = [
    { id: 'quizzes', label: 'Quizzes', icon: Brain, description: 'Multiple choice, true/false, and short answer' },
    { id: 'flashcards', label: 'Flashcards', icon: Zap, description: 'Front and back study cards' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Structured summary notes' },
    { id: 'mindmaps', label: 'Mind Maps', icon: Map, description: 'Visual concept connections' },
];

export default function StudyKitPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
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

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Fetch specific study kit if ID is present
    useEffect(() => {
        if (id) {
            fetchStudyKit(id);
        }
    }, [id]);

    const normalizeContent = (content: any) => {
        console.log('🔍 Starting normalization with:', JSON.stringify(content, null, 2));
        
        const parseIfString = (data: any) => {
            if (typeof data === 'string') {
                try {
                    return JSON.parse(data);
                } catch {
                    return data;
                }
            }
            return data;
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
            <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
                    <p className="text-zinc-400">Loading study kit...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (id && error && !studyKit) {
        return (
            <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
                <div className="text-center max-w-md">
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
        <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    {id && studyKit ? (
                        <div className="flex items-center gap-4 mb-4">
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
                                                console.log('Quiz data structure:', generatedContent.quizzes);
                                                
                                                // Handle different data structures
                                                let quizData = generatedContent.quizzes;
                                                
                                                // If it's an object with questions property, extract it
                                                if (!Array.isArray(quizData) && quizData.questions) {
                                                    quizData = quizData.questions;
                                                }
                                                
                                                // Ensure it's an array
                                                if (!Array.isArray(quizData)) {
                                                    return (
                                                        <div className="p-6 bg-zinc-900 rounded-xl">
                                                            <p className="text-zinc-400 mb-4">Unexpected quiz data format:</p>
                                                            <pre className="text-xs text-zinc-500 whitespace-pre-wrap">
                                                                {JSON.stringify(generatedContent.quizzes, null, 2)}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                
                                                if (quizData.length === 0) {
                                                    return (
                                                        <div className="p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">
                                                            No quizzes available
                                                        </div>
                                                    );
                                                }
                                                
                                                return quizData.map((quiz: any, i: number) => (
                                                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                                        <h3 className="font-bold text-lg mb-4 flex gap-3">
                                                            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                                                {i + 1}
                                                            </span>
                                                            {quiz.question || 'No question available'}
                                                        </h3>
                                                        <div className="space-y-2 pl-11">
                                                            {quiz.options?.map((opt: string, optIndex: number) => (
                                                                <div
                                                                    key={optIndex}
                                                                    className={`p-3 rounded-lg border ${optIndex === quiz.correctAnswer
                                                                            ? 'border-green-500/50 bg-green-500/10 text-green-200'
                                                                            : 'border-zinc-800 bg-zinc-950/50'
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </div>
                                                            )) || <p className="text-zinc-500">No options available</p>}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}

                                    {activeTab === 'flashcards' && generatedContent.flashcards && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {(() => {
                                                console.log('Flashcard data structure:', generatedContent.flashcards);
                                                
                                                let flashcardData = generatedContent.flashcards;
                                                
                                                // If it's an object with flashcards or cards property, extract it
                                                if (!Array.isArray(flashcardData)) {
                                                    if (flashcardData.flashcards) {
                                                        flashcardData = flashcardData.flashcards;
                                                    } else if (flashcardData.cards) {
                                                        flashcardData = flashcardData.cards;
                                                    }
                                                }
                                                
                                                // Ensure it's an array
                                                if (!Array.isArray(flashcardData)) {
                                                    return (
                                                        <div className="col-span-full p-6 bg-zinc-900 rounded-xl">
                                                            <p className="text-zinc-400 mb-4">Unexpected flashcard data format:</p>
                                                            <pre className="text-xs text-zinc-500 whitespace-pre-wrap">
                                                                {JSON.stringify(generatedContent.flashcards, null, 2)}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                
                                                if (flashcardData.length === 0) {
                                                    return (
                                                        <div className="col-span-full p-6 bg-zinc-900 rounded-xl text-center text-zinc-400">
                                                            No flashcards available
                                                        </div>
                                                    );
                                                }
                                                
                                                return flashcardData.map((card: any, i: number) => (
                                                    <div key={i} className="group relative h-64 perspective-1000">
                                                        <div className="relative w-full h-full transition-all duration-500 bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50">
                                                            <h4 className="text-zinc-500 text-xs uppercase font-bold mb-2">Front</h4>
                                                            <p className="font-medium text-lg">{card.front || 'No content'}</p>

                                                            <div className="absolute inset-0 bg-indigo-900/90 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                                <h4 className="text-indigo-300 text-xs uppercase font-bold mb-2">Back</h4>
                                                                <p className="font-medium text-lg text-white">{card.back || 'No content'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}

                                    {activeTab === 'notes' && generatedContent.notes && (
                                        <div className="prose prose-invert max-w-none bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                                            {(() => {
                                                console.log('Notes data structure:', generatedContent.notes);
                                                
                                                let notesContent = generatedContent.notes;
                                                
                                                // If it's an object with notes property, extract it
                                                if (typeof notesContent === 'object' && !Array.isArray(notesContent)) {
                                                    if (notesContent.notes) {
                                                        notesContent = Array.isArray(notesContent.notes) 
                                                            ? notesContent.notes.join('\n\n')
                                                            : notesContent.notes;
                                                    } else {
                                                        return (
                                                            <div>
                                                                <p className="text-zinc-400 mb-4">Unexpected notes format:</p>
                                                                <pre className="text-xs text-zinc-500 whitespace-pre-wrap">
                                                                    {JSON.stringify(generatedContent.notes, null, 2)}
                                                                </pre>
                                                            </div>
                                                        );
                                                    }
                                                } else if (Array.isArray(notesContent)) {
                                                    notesContent = notesContent.join('\n\n');
                                                }
                                                
                                                // Now notesContent should be a string
                                                if (typeof notesContent !== 'string') {
                                                    return (
                                                        <div className="whitespace-pre-wrap text-zinc-300">
                                                            {JSON.stringify(notesContent, null, 2)}
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <div 
                                                        className="whitespace-pre-wrap"
                                                        dangerouslySetInnerHTML={{ 
                                                            __html: notesContent
                                                                .replace(/\n/g, '<br/>')
                                                                .replace(/#{3,} /g, '<h3 class="text-xl font-bold mt-6 mb-3 text-white">')
                                                                .replace(/## /g, '<h2 class="text-2xl font-bold mt-8 mb-4 text-white">')
                                                                .replace(/# /g, '<h1 class="text-3xl font-bold mt-8 mb-4 text-white">')
                                                        }} 
                                                    />
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {activeTab === 'mindmaps' && generatedContent.mindmaps && (
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 min-h-[500px] flex items-center justify-center">
                                            {/* Simplified Mind Map Visualization */}
                                            {typeof generatedContent.mindmaps === 'object' && (generatedContent.mindmaps.central || generatedContent.mindmaps.center) ? (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <div className="bg-indigo-600 text-white p-6 rounded-full font-bold text-xl shadow-lg shadow-indigo-500/30 z-10 relative">
                                                        {generatedContent.mindmaps.central || generatedContent.mindmaps.center?.topic || generatedContent.mindmaps.center}
                                                    </div>

                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        {(generatedContent.mindmaps.branches || generatedContent.mindmaps.center?.subtopics)?.map((branch: any, i: number, arr: any[]) => {
                                                            const angle = (i / arr.length) * 2 * Math.PI;
                                                            const x = Math.cos(angle) * 200;
                                                            const y = Math.sin(angle) * 150;
                                                            
                                                            // Handle different branch structures
                                                            const branchTopic = typeof branch === 'string' ? branch : branch.topic || branch.name;
                                                            const branchSubtopics = branch.subtopics || [];
                                                            
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute flex flex-col items-center"
                                                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                                                >
                                                                    <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-sm font-medium w-32 text-center mb-2 shadow-lg">
                                                                        {branchTopic}
                                                                    </div>
                                                                    {Array.isArray(branchSubtopics) && branchSubtopics.length > 0 && (
                                                                        <div className="bg-zinc-900/80 p-2 rounded text-xs text-zinc-400 w-40 text-center">
                                                                            {branchSubtopics.slice(0, 3).join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap text-zinc-300 text-sm max-w-2xl">
                                                    {JSON.stringify(generatedContent.mindmaps, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}