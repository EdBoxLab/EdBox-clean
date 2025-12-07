'use client';

import React, { useState, useEffect } from 'react';
import { Save, Download, Plus, Trash2, FileText, Loader2, Clock } from 'lucide-react';

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
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            if (data.notes) {
                setNotes(data.notes);
                if (data.notes.length > 0 && !currentNoteId) {
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
    };

    const createNewNote = () => {
        setCurrentNoteId(null);
        setTitle('');
        setContent('');
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;

        setIsSaving(true);
        try {
            const method = currentNoteId ? 'PUT' : 'POST';
            const body: any = { title, content };
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
            alert('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
            setNotes(prev => prev.filter(n => n.id !== id));
            if (currentNoteId === id) {
                createNewNote();
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#09090b] text-white flex">
            {/* Sidebar */}
            <div className={`w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col transition-all duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full absolute h-full z-10'}`}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-400" />
                        My Notes
                    </h2>
                    <button
                        onClick={createNewNote}
                        className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => loadNote(note)}
                                className={`p-3 rounded-lg cursor-pointer group transition ${currentNoteId === note.id
                                        ? 'bg-zinc-800 border-l-2 border-green-500'
                                        : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium truncate pr-2 ${currentNoteId === note.id ? 'text-white' : 'text-zinc-300'}`}>
                                        {note.title || 'Untitled Note'}
                                    </h3>
                                    <button
                                        onClick={(e) => handleDelete(note.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-zinc-500 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 truncate">{note.content}</p>
                                <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-600">
                                    <Clock className="w-3 h-3" />
                                    {new Date(note.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Editor */}
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${!showSidebar ? 'ml-0' : ''}`}>
                {/* Editor Header */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
                        >
                            <FileText className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title"
                            className="bg-transparent text-xl font-bold placeholder-zinc-600 focus:outline-none focus:placeholder-zinc-700 w-96"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                        <button className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-lg transition flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 p-6 relative">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start typing your thoughts..."
                        className="w-full h-full bg-transparent text-lg leading-relaxed text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none font-mono"
                        spellCheck={false}
                    />
                </div>
            </div>
        </div>
    );
}
