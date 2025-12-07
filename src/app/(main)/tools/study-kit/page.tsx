'use client';

import React, { useState } from 'react';
import { Upload, FileText, Brain, Zap, Map, CheckCircle2, Loader2, X, ChevronRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const contentTypes = [
    { id: 'quizzes', label: 'Quizzes', icon: Brain, description: 'Multiple choice, true/false, and short answer' },
    { id: 'flashcards', label: 'Flashcards', icon: Zap, description: 'Front and back study cards' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Structured summary notes' },
    { id: 'mindmaps', label: 'Mind Maps', icon: Map, description: 'Visual concept connections' },
];

export default function StudyKitPage() {
    const [prompt, setPrompt] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const toggleContentType = (id: string) => {
        setSelectedTypes(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const handleGenerate = async () => {
        if ((!prompt.trim() && !uploadedFile) || selectedTypes.length === 0) return;

        setIsGenerating(true);
        setGeneratedContent(null);
        setActiveTab(null);

        try {
            // If file is uploaded, reads its content (simplified for demo)
            // In a real app, you'd send formData to the API
            let contentPrompt = prompt;
            if (uploadedFile) {
                // For demo purposes, we'll append file info
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
                setGeneratedContent(data.content);
                setActiveTab(selectedTypes[0]);
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

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Study Kit Generator
                    </h1>
                    <p className="text-zinc-400">
                        Upload materials or enter a prompt to generate comprehensive study resources.
                    </p>
                </div>

                {/* Generation Interface */}
                {!generatedContent ? (
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
                                            <p className="text-sm text-zinc-500 mb-4">Supports PDF, PPTX, DOCX, images</p>
                                            <label className="inline-block px-6 py-2 border border-zinc-700 hover:border-indigo-500 rounded-lg cursor-pointer transition">
                                                <span className="text-zinc-300">Browse Files</span>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png"
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
                ) : (
                    // Generated Results View
                    <div className="space-y-6">
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
                            <button
                                onClick={() => setGeneratedContent(null)}
                                className="ml-auto px-4 py-2 text-zinc-500 hover:text-white transition flex items-center gap-2"
                            >
                                <X className="w-4 h-4" /> Create New
                            </button>
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
                                            {Array.isArray(generatedContent.quizzes) ? (
                                                generatedContent.quizzes.map((quiz: any, i: number) => (
                                                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                                        <h3 className="font-bold text-lg mb-4 flex gap-3">
                                                            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                                                {i + 1}
                                                            </span>
                                                            {quiz.question}
                                                        </h3>
                                                        <div className="space-y-2 pl-11">
                                                            {quiz.options.map((opt: string, optIndex: number) => (
                                                                <div
                                                                    key={optIndex}
                                                                    className={`p-3 rounded-lg border ${optIndex === quiz.correctAnswer
                                                                            ? 'border-green-500/50 bg-green-500/10 text-green-200'
                                                                            : 'border-zinc-800 bg-zinc-950/50'
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-6 bg-zinc-900 rounded-xl whitespace-pre-wrap">{generatedContent.quizzes}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'flashcards' && generatedContent.flashcards && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Array.isArray(generatedContent.flashcards) ? (
                                                generatedContent.flashcards.map((card: any, i: number) => (
                                                    <div key={i} className="group relative h-64 perspective-1000">
                                                        <div className="relative w-full h-full transition-all duration-500 bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50">
                                                            <h4 className="text-zinc-500 text-xs uppercase font-bold mb-2">Front</h4>
                                                            <p className="font-medium text-lg">{card.front}</p>

                                                            <div className="absolute inset-0 bg-indigo-900/90 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                                                <h4 className="text-indigo-300 text-xs uppercase font-bold mb-2">Back</h4>
                                                                <p className="font-medium text-lg text-white">{card.back}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full p-6 bg-zinc-900 rounded-xl whitespace-pre-wrap">{generatedContent.flashcards}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'notes' && generatedContent.notes && (
                                        <div className="prose prose-invert max-w-none bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                                            <div dangerouslySetInnerHTML={{ __html: generatedContent.notes.replace(/\n/g, '<br/>') }} />
                                        </div>
                                    )}

                                    {activeTab === 'mindmaps' && generatedContent.mindmaps && (
                                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 min-h-[500px] flex items-center justify-center">
                                            {/* Simplified Mind Map Visualization */}
                                            {typeof generatedContent.mindmaps === 'object' && generatedContent.mindmaps.central ? (
                                                <div className="relative w-full h-full flex items-center justify-center">
                                                    <div className="bg-indigo-600 text-white p-6 rounded-full font-bold text-xl shadow-lg shadow-indigo-500/30 z-10 relative">
                                                        {generatedContent.mindmaps.central}
                                                    </div>

                                                    {/* Branches - Simplified Radial Layout */}
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        {generatedContent.mindmaps.branches?.map((branch: any, i: number, arr: any[]) => {
                                                            const angle = (i / arr.length) * 2 * Math.PI;
                                                            const x = Math.cos(angle) * 200;
                                                            const y = Math.sin(angle) * 150;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute flex flex-col items-center"
                                                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                                                >
                                                                    <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-lg text-sm font-medium w-32 text-center mb-2 shadow-lg">
                                                                        {branch.topic}
                                                                    </div>
                                                                    {branch.subtopics && (
                                                                        <div className="bg-zinc-900/80 p-2 rounded text-xs text-zinc-400 w-40 text-center">
                                                                            {branch.subtopics.slice(0, 3).join(', ')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="whitespace-pre-wrap">{JSON.stringify(generatedContent.mindmaps, null, 2)}</div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
