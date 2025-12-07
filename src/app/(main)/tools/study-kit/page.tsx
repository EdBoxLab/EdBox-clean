'use client';

import React, { useState } from 'react';
import { Upload, FileText, Brain, Zap, Map, CheckCircle2, Loader2, X } from 'lucide-react';

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

    const handleGenerate = () => {
        if ((prompt.trim() || uploadedFile) && selectedTypes.length > 0) {
            setIsGenerating(true);
            // TODO: Implement generation logic
            setTimeout(() => setIsGenerating(false), 2000);
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

                {/* Main Content */}
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
                            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Generate Study Kit
                                </>
                            )}
                        </button>

                        {selectedTypes.length === 0 && (
                            <p className="text-sm text-center text-zinc-500">Select at least one content type to continue</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
