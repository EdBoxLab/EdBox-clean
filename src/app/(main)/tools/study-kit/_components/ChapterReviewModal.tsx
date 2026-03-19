'use client';

import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X } from 'lucide-react';
import { preprocessMarkdown } from '../utils';

interface ChapterReviewModalProps {
    detectedChapters: any[];
    mounted: boolean;
    onConfirm: (chapters: any[]) => void;
    onCancel: () => void;
}

export function ChapterReviewModal({
    detectedChapters,
    mounted,
    onConfirm,
    onCancel,
}: ChapterReviewModalProps) {
    if (!detectedChapters.length || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
            <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl my-8 border border-zinc-700 shadow-2xl relative z-[10000]">
                <div className="p-4 sm:p-6 border-b border-zinc-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Review Detected Chapters</h2>
                            <p className="text-zinc-400 text-sm mt-1">
                                We found {detectedChapters.length} chapters in your document. Review and adjust before generating.
                            </p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition self-end sm:self-auto"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
                    <div className="space-y-3 sm:space-y-4">
                        {detectedChapters.map((chapter, index) => (
                            <div key={chapter.id} className="bg-zinc-800/50 rounded-xl p-3 sm:p-4 border border-zinc-700">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm sm:text-base shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-zinc-300 text-xs sm:text-sm prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-h1:text-base prose-h1:font-bold prose-h2:text-sm prose-h2:font-semibold prose-h3:text-sm">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    table: ({ node, ...props }) => <div className="overflow-x-auto my-3 border border-zinc-700 rounded-lg"><table className="w-full text-left border-collapse min-w-full" {...props} /></div>,
                                                    th: ({ node, ...props }) => <th className="border-b border-zinc-700 px-3 py-2 bg-zinc-800/50 font-bold text-zinc-300 whitespace-nowrap text-xs" {...props} />,
                                                    td: ({ node, ...props }) => <td className="border-b border-zinc-700/50 px-3 py-2 text-zinc-400 text-xs" {...props} />,
                                                    hr: () => <hr className="border-zinc-700 my-3" />,
                                                    p: ({ node, ...props }) => <p className="my-1 text-zinc-300" {...props} />
                                                }}
                                            >
                                                {preprocessMarkdown((chapter.title || '') + '\n\n' + (chapter.summary || ''))}
                                            </ReactMarkdown>
                                        </div>
                                        {chapter.keyTopics && chapter.keyTopics.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                                                {chapter.keyTopics.slice(0, 5).map((topic: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 sm:py-1 bg-zinc-700 rounded text-xs text-zinc-300">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 sm:p-6 border-t border-zinc-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(detectedChapters)}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition order-1 sm:order-2 text-center"
                    >
                        Generate Study Kit with {detectedChapters.length} Chapters
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
