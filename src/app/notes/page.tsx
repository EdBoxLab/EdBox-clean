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
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4 text-red-600" />
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
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              New Note
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {notes.length === 0 ? (
              <div className="text-center text-gray-400 mt-12">
                <Book className="h-14 w-14 mx-auto mb-4 opacity-40" />
                No notes yet
              </div>
            ) : (
              <ul className="space-y-2">
                {notes.map(note => (
                  <li
                    key={note.id}
                    onClick={() => openEditor(note)}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
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

          {/* MOBILE HEADER */}
          <div className="md:hidden sticky top-0 z-10 bg-white border-b p-3 flex items-center gap-2">
            <button onClick={() => setScreen('list')}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-semibold truncate flex-1">
              {isEditing ? 'Editing Note' : selectedNote.title}
            </h2>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden md:flex items-center justify-between p-4 border-b bg-white">
            {isEditing ? (
              <input
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                className="text-xl font-bold border-b outline-none flex-1"
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
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteNote}
                    className="p-2 bg-red-600 text-white rounded-lg"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Save
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
                className="w-full min-h-[300px] p-4 border rounded-lg resize-none"
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

          {/* MOBILE ACTION RAIL */}
          <div className="md:hidden fixed right-3 bottom-24 z-40 flex flex-col gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-blue-600 text-white rounded-full shadow-lg"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="p-3 bg-red-600 text-white rounded-full shadow-lg"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveNote}
                  className="p-3 bg-green-600 text-white rounded-full shadow-lg"
                >
                  <Save className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-3 bg-gray-400 text-white rounded-full shadow-lg"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </main>
      )}
    </div>
  );
}