'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GenieSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    contextText: string;
}

export function GenieSidePanel({ isOpen, onClose, contextText }: GenieSidePanelProps) {
    const [explanation, setExplanation] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && contextText) {
            handleExplain();
        } else {
            setExplanation(''); // Reset on close
        }
    }, [isOpen, contextText]);

    const handleExplain = async () => {
        setIsLoading(true);
        setExplanation('');

        try {
            // We use a simplified fetch here, assuming an API endpoint exists or reusing the generation endpoint in a lightweight way.
            // For now, let's use the study-kit generate-more endpoint but repurposed, or even better, a new quick endpoint.
            // Since we don't have a dedicated "explain snippet" endpoint yet, I'll simulate or use the chat API if available. 
            // Looking at file structure, `api/chat` might be best, but `api/study-kit/generate` is safer for now if we craft the prompt right.

            // Let's assume we use a specialized prompt to the generate endpoint for now for simplicity, 
            // OR ideally we should use the `GenieAssistant` logic. 
            // Given the constraints, I will use `api/study-kit/generate` with a custom prompt for a "note" of depth "summary" on this specific text.

            const response = await fetch('/api/study-kit/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Explain this concept simply: "${contextText}"`,
                    contentTypes: ['notes'],
                    notesDepth: 'summary', // Short explanation
                    itemCount: 1,
                    customInstructions: 'Act as a tutor explaining a specific term. Be concise (max 150 words). Use "Compare to" or "Analogy" if helpful.'
                })
            });

            const data = await response.json();
            if (data.success && data.content && data.content.notes) {
                setExplanation(data.content.notes);
            } else {
                setExplanation('Sorry, I couldn\'t explain that right now.');
            }
        } catch (error) {
            console.error('Genie explanation failed:', error);
            setExplanation('An error occurred while asking Genie.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[60]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold">
                                <Sparkles className="w-4 h-4" />
                                <span>Genie Explains</span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="mb-6">
                                <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2 flex items-center gap-2">
                                    <BookOpen className="w-3 h-3" /> Selected Context
                                </h4>
                                <div className="p-3 bg-zinc-900 rounded-lg border-l-2 border-indigo-500 text-zinc-300 text-sm italic">
                                    "{contextText}"
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-sm">Consulting the library...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {explanation}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
