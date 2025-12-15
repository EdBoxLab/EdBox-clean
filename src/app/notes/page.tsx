
'use client';

import { useEffect, useState } from 'react';
import { Plus, Book, Trash, Edit, Save, Menu } from 'lucide-react';
import { ViewNoteDialog } from '@/components/view-note-dialog';

/* ================= TYPES ================= */

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ================= PAGE ================= */

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ================= FETCH ================= */

  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) throw new Error('Failed to load notes');
        const data: Note[] = await res.json();
        if (active) setNotes(data);
      } catch (err) {
        if (active) setError('Could not load notes');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotes();
    return () => {
      active = false;
    };
  }, []);

  /* ================= ACTIONS ================= */

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setIsEditing(false);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '' }),
      });

      if (!res.ok) throw new Error();
      const newNote: Note = await res.json();

      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setEditedTitle(newNote.title);
      setEditedContent('');
      setIsEditing(true);
      setSidebarOpen(false);
    } catch {
      setError('Failed to create note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    } catch {
      setError('Failed to delete note');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full border rounded-lg overflow-hidden">
      {/* ================= MOBILE TOPBAR ================= */}
      <div className="flex md:hidden justify-between items-center p-2 border-b border-gray-300 bg-white">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Toggle Notes List"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate">Notes</h1>
        <button
          onClick={handleNewNote}
          className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          bg-white border-r md:border-r-0 md:relative
          md:w-1/4 w-full md:block
          ${sidebarOpen ? 'block absolute z-50 top-0 left-0 h-full shadow-lg' : 'hidden'}
          md:overflow-y-auto overflow-y-auto
        `}
      >
        <div className="p-4">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center gap-2 p-2 mb-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 md:hidden"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>

          <ul className="space-y-1">
            {notes.map(note => (
              <li
                key={note.id}
                className={`p-2 rounded-lg cursor-pointer ${
                  selectedNote?.id === note.id
                    ? 'bg-gray-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => handleSelectNote(note)}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {note.content || 'No content'}
                    </p>
                  </div>
                  <ViewNoteDialog note={note} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ================= EDITOR ================= */}
      <main className="flex-1 p-4 overflow-y-auto">
        {selectedNote ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              {isEditing ? (
                <input
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold w-full border-b outline-none"
                  placeholder="Note Title"
                />
              ) : (
                <h2 className="text-2xl font-bold truncate">{selectedNote.title}</h2>
              )}

              <div className="flex gap-2 shrink-0">
                {isEditing ? (
                  <button
                    title="Save"
                    onClick={handleSaveNote}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    title="Edit"
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}

                <button
                  title="Delete"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="w-full h-[calc(100%-4rem)] p-3 border rounded-lg resize-none"
                placeholder="Write your note…"
              />
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap">
                {selectedNote.content || 'No content'}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Book className="h-12 w-12 mb-4" />
            <p>Select or create a note</p>
          </div>
        )}
      </main>
    </div>
  );
}
