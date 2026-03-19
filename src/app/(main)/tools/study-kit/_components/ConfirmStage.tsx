'use client';

import React from 'react';
import { ArrowLeft, FileText, X, Upload, Zap, Loader2 } from 'lucide-react';

export const ConfirmStage = ({
    multiSelectedTypes,
    setCurrentStep,
    prompt,
    setPrompt,
    uploadedFile,
    setUploadedFile,
    handleFileChange,
    fileInputRef,
    depthOption,
    countOption,
    isGenerating,
    handleGenerate
}: any) => {
    const types = multiSelectedTypes;

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
                    <Zap className="w-8 h-8 text-indigo-400 mb-3" />
                    <div className="text-zinc-300">
                        I will generate:
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {types.map((t: string) => (
                                <span key={t} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <p className="mt-4 text-sm">
                            {types.includes('notes') && `Notes Depth: ${depthOption}`}
                            {types.some((t: string) => t && ['quizzes', 'flashcards'].includes(t)) && ` • Items: ${countOption}`}
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
