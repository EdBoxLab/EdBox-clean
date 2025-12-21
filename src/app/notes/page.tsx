'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Book,
  Trash,
  Edit,
  Save,
  ChevronLeft,
  AlertCircle,
  X,
} from 'lucide-react';
import { ViewNoteDialog } from '@/components/view-note-dialog';

/* ================= TYPES ================= */

interface Note {
  id: string;
  title: string;
  content: string;
}

type Screen = 'list' | 'editor';

/* ================= PAGE ================= */

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [screen, setScreen] = useState<Screen>('list');

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* ================= DATA ================= */

  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) throw new Error();
        const data: Note[] = await res.json();
        if (active) setNotes(data);
      } catch {
        if (active) setError('Failed to load notes');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotes();
    return () => {
      active = false;
    };
  }, []);

  /* ================= HELPERS ================= */

  const openEditor = (note: Note) => {
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setIsEditing(false);
    setScreen('editor');
  };

  const handleNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '' }),
      });

      if (!res.ok) throw new Error();
      const note: Note = await res.json();

      setNotes(prev => [note, ...prev]);
      openEditor(note);
      setIsEditing(true);
    } catch {
      setError('Failed to create note');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle.trim() || 'Untitled Note',
          content: editedContent,
        }),
      });

      if (!res.ok) throw new Error();
      const updated: Note = await res.json();

      setNotes(prev =>
        prev.map(n => (n.id === updated.id ? updated : n))
      );
      setSelectedNote(updated);
      setIsEditing(false);
    } catch {
      setError('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      await fetch(`/api/notes/${selectedNote.id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
      setSelectedNote(null);
      setScreen('list');
      setIsEditing(false);
    } catch {
      setError('Failed to delete note');
    }
  };

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading notes…
      </div>
    );
  }

  return (
    <div className="relative flex h-full md:border md:rounded-lg overflow-hidden">

      {/* ERROR TOAST */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 shadow">
          <AlertCircle className="h-5 w-5 text-red-600" strokeWidth={2} />
          <p className="text-sm text-red-800 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-0.5">
            <X className="h-4 w-4 text-red-600" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ================= LIST SCREEN ================= */}
      {screen === 'list' && (
        <aside className="w-full md:w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">My Notes</h1>
            <button
              onClick={handleNewNote}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800"
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
              New Note
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {notes.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <Book className="h-14 w-14 mx-auto mb-4 opacity-40" strokeWidth={1.5} />
                No notes yet
              </div>
            ) : (
              <ul className="space-y-2">
                {notes.map(note => (
                  <li
                    key={note.id}
                    onClick={() => openEditor(note)}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer active:bg-gray-200"
                  >
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {note.content || 'Empty note'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}

      {/* ================= EDITOR SCREEN ================= */}
      {screen === 'editor' && selectedNote && (
        <main className="flex-1 flex flex-col bg-gray-50">

          {/* MOBILE HEADER - FIXED WITH ACTION BUTTONS */}
          <div className="md:hidden sticky top-0 z-10 bg-white border-b p-3 flex items-center gap-2">
            <button 
              onClick={() => setScreen('list')}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg active:bg-gray-200"
              aria-label="Back to list"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            
            {isEditing ? (
              <input
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                className="text-base font-semibold flex-1 border-b outline-none px-2 py-1"
                placeholder="Note title"
              />
            ) : (
              <h2 className="font-semibold truncate flex-1 text-base">
                {selectedNote.title}
              </h2>
            )}

            {/* Action buttons in mobile header */}
            {!isEditing ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 active:bg-blue-100"
                  aria-label="Edit note"
                >
                  <Edit className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="p-2 text-red-600 rounded-lg hover:bg-red-50 active:bg-red-100"
                  aria-label="Delete note"
                >
                  <Trash className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(selectedNote.title);
                    setEditedContent(selectedNote.content);
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-200 rounded-md hover:bg-gray-300 active:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="h-4 w-4" strokeWidth={2} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden md:flex items-center justify-between p-4 border-b bg-white">
            {isEditing ? (
              <input
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                className="text-xl font-bold border-b outline-none flex-1"
                placeholder="Note title"
              />
            ) : (
              <h2 className="text-xl font-bold truncate">
                {selectedNote.title}
              </h2>
            )}

            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" strokeWidth={2} />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                    aria-label="Delete note"
                  >
                    <Trash className="h-4 w-4" strokeWidth={2} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTitle(selectedNote.title);
                      setEditedContent(selectedNote.content);
                    }}
                    className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" strokeWidth={2} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-4">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="w-full min-h-[300px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your note…"
              />
            ) : (
              <div className="bg-white rounded-lg p-4 whitespace-pre-wrap">
                {selectedNote.content || (
                  <span className="text-gray-400 italic">
                    This note is empty
                  </span>
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}