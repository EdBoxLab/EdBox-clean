'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, Plus, Send, Copy, FileText, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

import { NoteNavigation } from '@/components/NoteNavigation';
import { TextSelectionTooltip } from '@/components/TextSelectionTooltip';
import { GenieSidePanel } from '@/components/GenieSidePanel';
import { noteSubTabs } from '../constants';
import {
    CustomEdBoxTable,
    CustomEdBoxThead,
    CustomEdBoxTr,
    CustomEdBoxTh,
    CustomEdBoxTd
} from '@/components/ui/CustomEdBoxTable';

export const NotesView = ({
    displayContent,
    activeNoteType,
    setActiveNoteType,
    handleAskGenie,
    isGenieOpen,
    setIsGenieOpen,
    genieContext,
    showNotesModal,
    setShowNotesModal,
    notesSpecification,
    setNotesSpecification,
    notesAdRewarded,
    setNotesAdRewarded,
    studyKit,
    isPremium,
    isGeneratingMore,
    handleGenerateMore,
    handleWatchAd
}: any) => {
    return (
        <div className="space-y-6 relative">
            {/* Note Navigation HUD */}
            <NoteNavigation content={displayContent.notes?.[activeNoteType] || ''} />

            {/* Genie Interaction */}
            <TextSelectionTooltip onAskGenie={handleAskGenie} />
            <GenieSidePanel
                isOpen={isGenieOpen}
                onClose={() => setIsGenieOpen(false)}
                contextText={genieContext}
            />

            {/* Notes Header */}
            <div className="bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-purple-950/50 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {(() => {
                            const activeSubTab = noteSubTabs.find(t => t.id === activeNoteType);
                            const Icon = activeSubTab?.icon || FileText;
                            return (
                                <div className={`w-12 h-12 ${activeSubTab?.bg || 'bg-indigo-500/20'} rounded-2xl flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${activeSubTab?.color || 'text-indigo-400'}`} />
                                </div>
                            );
                        })()}
                        <div>
                            <h3 className="text-xl font-bold text-white">Study Notes</h3>
                            <p className="text-sm text-zinc-400">
                                {noteSubTabs.find(t => t.id === activeNoteType)?.tag || 'AI-generated comprehensive notes'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const notes = displayContent.notes;
                            const currentNote = notes?.[activeNoteType] || '';
                            navigator.clipboard.writeText(currentNote);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all"
                    >
                        <Copy className="w-4 h-4" />
                        Copy
                    </button>
                </div>
            </div>

            {/* Note Sub-Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-1">
                {noteSubTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeNoteType === tab.id;
                    const hasContent = !!(displayContent.notes?.[tab.id]);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveNoteType(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${isActive
                                ? `${tab.bg} ${tab.border} ${tab.color}`
                                : hasContent
                                    ? 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-700'
                                    : 'border-zinc-800/50 bg-zinc-900/30 text-zinc-600 cursor-default'
                                }`}
                            disabled={!hasContent}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    );
                })}
            </div>

            {/* Notes Content */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Decorative top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="p-6 sm:p-10">
                    <article className="prose prose-invert max-w-none 
            prose-headings:font-black prose-headings:tracking-tight
            prose-h1:text-4xl sm:prose-h1:text-5xl prose-h1:mb-12 prose-h1:pb-8 prose-h1:border-b-4 prose-h1:border-indigo-500/50 prose-h1:bg-gradient-to-r prose-h1:from-white prose-h1:via-indigo-200 prose-h1:to-purple-200 prose-h1:bg-clip-text prose-h1:text-transparent
            prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-indigo-400 prose-h2:flex prose-h2:items-center prose-h2:gap-4 prose-h2:uppercase prose-h2:tracking-wider
            prose-h3:text-2xl prose-h3:text-zinc-100 prose-h3:mt-12 prose-h3:mb-6 prose-h3:font-black
            prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-6 prose-p:text-lg
            prose-li:text-zinc-300 prose-li:my-3 prose-li:marker:text-indigo-400 prose-li:text-lg
            prose-strong:text-indigo-300 prose-strong:font-black prose-strong:underline prose-strong:underline-offset-4 prose-strong:decoration-indigo-500/30
            prose-blockquote:border-l-8 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:rounded-2xl prose-blockquote:my-10 prose-blockquote:not-italic prose-blockquote:text-indigo-100 prose-blockquote:text-xl prose-blockquote:font-medium
            prose-hr:border-zinc-800 prose-hr:my-16
            prose-table:my-12 prose-table:border-spacing-0 prose-table:border-separate
            prose-th:bg-zinc-900 prose-th:text-indigo-400 prose-th:font-black prose-th:tracking-widest prose-th:py-4
            prose-td:py-4 prose-td:text-zinc-300
        ">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath] as any}
                            rehypePlugins={[rehypeKatex] as any}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="relative flex items-center gap-4">
                                        <Zap className="w-10 h-10 text-indigo-400 shrink-0" />
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => {
                                    // Extract emoji if present to use as icon
                                    const text = String(children);
                                    const emojiMatch = text.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}])/u);
                                    const emoji = emojiMatch ? emojiMatch[0] : null;
                                    const cleanText = emoji ? text.replace(emoji, '').trim() : text;

                                    return (
                                        <h2 className="group flex items-center gap-4">
                                            {emoji ? (
                                                <span className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl text-2xl group-hover:border-indigo-500 transition-all shadow-xl shadow-indigo-500/10">
                                                    {emoji}
                                                </span>
                                            ) : (
                                                <span className="w-12 h-12 flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 text-xl font-black group-hover:bg-indigo-500/20 transition-all">§</span>
                                            )}
                                            {cleanText}
                                        </h2>
                                    );
                                },
                                blockquote: ({ children }) => (
                                    <blockquote className="relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Crown className="w-20 h-20 text-indigo-400" />
                                        </div>
                                        <div className="relative z-10">
                                            {children}
                                        </div>
                                    </blockquote>
                                ),
                                ul: ({ children }) => (
                                    <ul className="space-y-4 my-8">
                                        {children}
                                    </ul>
                                ),
                                li: ({ children }) => (
                                    <li className="flex items-start gap-4">
                                        <div className="mt-2.5 w-2.5 h-2.5 rounded-full bg-indigo-500/50 border border-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)] shrink-0"></div>
                                        <span className="flex-1">{children}</span>
                                    </li>
                                ),
                                table: ({ children }) => (
                                    <CustomEdBoxTable>{children}</CustomEdBoxTable>
                                ),
                                thead: ({ children }) => (
                                    <CustomEdBoxThead>{children}</CustomEdBoxThead>
                                ),
                                tbody: ({ children }) => (
                                    <tbody className="divide-y divide-zinc-800/50">{children}</tbody>
                                ),
                                tr: ({ children }) => (
                                    <CustomEdBoxTr>{children}</CustomEdBoxTr>
                                ),
                                th: ({ children }) => (
                                    <CustomEdBoxTh>{children}</CustomEdBoxTh>
                                ),
                                td: ({ children }) => (
                                    <CustomEdBoxTd>{children}</CustomEdBoxTd>
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
                                                    style={vscDarkPlus as any}
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
                            {displayContent.notes?.[activeNoteType] || 'No content available for this note type.'}
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
                                    <Plus className="w-4 h-4" />
                                    Generate Custom Notes
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleWatchAd('notes')}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold text-sm transition-all shadow-lg"
                                >
                                    <Plus className="w-4 h-4" />
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
    );
};
