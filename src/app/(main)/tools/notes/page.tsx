'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Save, 
    Download, 
    Plus, 
    Trash2, 
    FileText, 
    Loader2, 
    Clock, 
    Search, 
    ChevronLeft, 
    MoreVertical,
    Share2,
    Calendar,
    Tag,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
    id: string;
    title: string;
    content: string;
    updated_at: string;
}

export default function NotesPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
    const [isMobile, setIsMobile] = useState(false);
    
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check for mobile screen
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            if (data.notes) {
                setNotes(data.notes);
                if (data.notes.length > 0 && !currentNoteId && window.innerWidth >= 768) {
                    loadNote(data.notes[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadNote = (note: Note) => {
        setCurrentNoteId(note.id);
        setTitle(note.title);
        setContent(note.content);
        if (isMobile) setMobileView('editor');
    };

    const createNewNote = () => {
        setCurrentNoteId(null);
        setTitle('');
        setContent('');
        if (isMobile) setMobileView('editor');
    };

    const handleSave = async (manual = true) => {
        if (!title.trim() && !content.trim()) return;

        if (manual) setIsSaving(true);
        try {
            const method = currentNoteId ? 'PUT' : 'POST';
            const body: any = { 
                title: title || 'Untitled Note', 
                content: content || '' 
            };
            if (currentNoteId) body.id = currentNoteId;

            const response = await fetch('/api/notes', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.note) {
                if (currentNoteId) {
                    setNotes(prev => prev.map(n => n.id === currentNoteId ? data.note : n));
                } else {
                    setNotes(prev => [data.note, ...prev]);
                    setCurrentNoteId(data.note.id);
                }
            }
        } catch (error) {
            console.error('Error saving note:', error);
            if (manual) alert('Failed to save note');
        } finally {
            if (manual) setIsSaving(false);
        }
    };

    // Auto-save logic
    useEffect(() => {
        if (!currentNoteId && !title && !content) return;
        
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
            handleSave(false);
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [title, content]);

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            setNotes(prev => prev.filter(n => n.id !== id));
            if (currentNoteId === id) {
                setCurrentNoteId(null);
                setTitle('');
                setContent('');
                if (isMobile) setMobileView('list');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-[calc(100vh-64px-5rem)] lg:h-[calc(100vh-64px)] overflow-hidden bg-[#09090b] text-zinc-100 flex relative -mb-20 lg:mb-0">
            
            <AnimatePresence mode="wait">
                {(!isMobile || mobileView === 'list') && (
                    <motion.div 
                        initial={isMobile ? { x: -300, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className={`${isMobile ? 'w-full' : 'w-80 border-r border-zinc-800/50'} bg-zinc-900/20 backdrop-blur-xl flex flex-col z-20`}
                    >
                        {/* Sidebar Header */}
                        <div className="p-6 pb-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-green-400" />
                                    </div>
                                    Notes
                                </h2>
                                {!isMobile && (
                                    <button
                                        onClick={createNewNote}
                                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-green-400 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-50">
                                    <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                                    <p className="text-xs">Syncing notes...</p>
                                </div>
                            ) : filteredNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40 text-center px-6">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-2">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">No notes found</p>
                                        <p className="text-xs mt-1">Try a different search or create your first note.</p>
                                    </div>
                                </div>
                            ) : (
                                filteredNotes.map(note => (
                                    <motion.div
                                        layout
                                        key={note.id}
                                        onClick={() => loadNote(note)}
                                        className={`p-4 rounded-2xl cursor-pointer group transition-all duration-300 relative overflow-hidden ${
                                            currentNoteId === note.id
                                                ? 'bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5'
                                                : 'bg-zinc-800/30 border border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h3 className={`font-semibold text-[15px] truncate pr-4 ${
                                                currentNoteId === note.id ? 'text-green-400' : 'text-zinc-200'
                                            }`}>
                                                {note.title || 'Untitled'}
                                            </h3>
                                            {!isMobile && (
                                                <button
                                                    onClick={(e) => handleDelete(note.id, e)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                                            {note.content || 'Start writing...'}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(note.updated_at)}
                                            </div>
                                            {currentNoteId === note.id && (
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-1.5 h-1.5 rounded-full bg-green-500" 
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* FAB for Mobile */}
                        {isMobile && mobileView === 'list' && (
                            <motion.button
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                onClick={createNewNote}
                                className="fixed bottom-8 right-8 w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-black shadow-xl shadow-green-500/20 active:scale-95 transition-transform z-50"
                            >
                                <Plus className="w-7 h-7" />
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Editor */}
            <AnimatePresence mode="wait">
                {(!isMobile || mobileView === 'editor') && (
                    <motion.div 
                        initial={isMobile ? { x: 300, opacity: 0 } : false}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className="flex-1 flex flex-col h-full bg-[#09090b] relative z-10"
                    >
                        {/* Editor Header */}
                        <div className="h-20 md:h-24 border-b border-zinc-800/50 flex items-center justify-between px-4 md:px-10 bg-[#09090b]/80 backdrop-blur-md sticky top-0">
                            <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                                {isMobile && (
                                    <button
                                        onClick={() => setMobileView('list')}
                                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 active:scale-95 transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Note Title"
                                        className="bg-transparent text-xl md:text-2xl font-bold placeholder-zinc-800 focus:outline-none w-full truncate"
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-orange-500 animate-pulse' : 'bg-green-500/50'}`} />
                                        <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                                            {isSaving ? 'Saving Changes...' : 'Changes Saved'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-4 ml-4">
                                <button className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors hidden md:flex">
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    className="h-10 md:h-11 px-4 md:px-6 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span className="hidden md:inline">Save</span>
                                </button>
                                {isMobile && (
                                    <button 
                                        onClick={() => handleDelete(currentNoteId!, undefined)}
                                        className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-red-500 active:scale-95"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 p-6 md:p-10 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#09090b] to-transparent z-0 pointer-events-none" />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write something incredible..."
                                className="w-full h-full bg-transparent text-base md:text-lg leading-relaxed text-zinc-300 placeholder-zinc-800 focus:outline-none resize-none custom-scrollbar font-medium z-10"
                                spellCheck={false}
                            />
                        </div>

                        {/* Bottom Toolbar (Mobile Only) */}
                        {isMobile && mobileView === 'editor' && (
                            <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex items-center justify-around">
                                <button className="p-2 text-zinc-500"><Tag className="w-5 h-5" /></button>
                                <button className="p-2 text-zinc-500"><Clock className="w-5 h-5" /></button>
                                <button className="p-2 text-zinc-500"><Download className="w-5 h-5" /></button>
                                <button className="p-2 text-zinc-500"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}
