'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Book, Trash, Edit, Save, Menu, X, AlertCircle, ChevronLeft } from 'lucide-react';
import { ViewNoteDialog } from '@/components/view-note-dialog';

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch notes on mount
  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data: Note[] = await res.json();
        if (active) setNotes(data);
      } catch (err) {
        if (active) setError('Could not load notes. Please refresh the page.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotes();
    return () => {
      active = false;
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedContent, isEditing]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Don't trigger shortcuts on mobile
      if (window.innerWidth < 768) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isEditing && selectedNote) {
          handleSaveNote();
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedNote && !isEditing) {
          setIsEditing(true);
        }
      }

      if (e.key === 'Escape') {
        if (isEditing) {
          handleCancelEdit();
        } else if (sidebarOpen) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isEditing, selectedNote, sidebarOpen]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (isEditing && selectedNote) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveNote(true);
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedTitle, editedContent, isEditing]);

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setIsEditing(false);
    setSidebarOpen(false);
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
    }
    setIsEditing(false);
  };

  const handleNewNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Note', content: '' }),
      });

      if (!res.ok) throw new Error('Failed to create note');
      const newNote: Note = await res.json();

      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setEditedTitle(newNote.title);
      setEditedContent('');
      setIsEditing(true);
      setSidebarOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to create note. Please try again.');
    }
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNoteToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    try {
      await fetch(`/api/notes/${noteToDelete}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteToDelete));
      
      if (selectedNote?.id === noteToDelete) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete note. Please try again.');
    } finally {
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    }
  };

  const handleSaveNote = async (silent = false) => {
    if (!selectedNote) return;
    if (!silent) setIsSaving(true);

    try {
      const res = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle.trim() || 'Untitled Note',
          content: editedContent,
        }),
      });

      if (!res.ok) throw new Error('Failed to save note');
      const updated: Note = await res.json();

      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
      if (!silent) setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to save note. Please try again.');
    } finally {
      if (!silent) setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen md:min-h-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading notes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full md:border md:rounded-lg overflow-hidden relative min-h-screen md:min-h-0">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 shadow-lg flex items-start gap-2 md:gap-3 md:max-w-md">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-lg p-6 w-full md:max-w-sm md:w-full shadow-xl animate-slide-up">
            <h3 className="text-lg font-bold mb-2">Delete Note?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 md:flex-none px-4 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 md:flex-none px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR/LIST VIEW - Full screen on mobile when no note selected */}
      <aside
        className={`
          bg-white md:border-r md:w-80 w-full
          ${selectedNote ? 'hidden md:block' : 'block'}
          ${sidebarOpen ? 'fixed z-50 inset-0 md:relative' : ''}
          overflow-y-auto flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">My Notes</h1>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" /> New Note
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Book className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="mb-2 font-medium">No notes yet</p>
              <p className="text-sm text-gray-400">Tap "New Note" to get started</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map(note => (
                <li
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 rounded-lg cursor-pointer transition-all active:scale-98 ${
                    selectedNote?.id === note.id 
                      ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate mb-1">{note.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {note.content || 'Empty note'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <ViewNoteDialog note={note} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* EDITOR VIEW - Full screen on mobile when note is selected */}
      <main className={`
        flex-1 flex flex-col overflow-hidden bg-gray-50
        ${selectedNote ? 'block' : 'hidden md:flex'}
      `}>
        {selectedNote ? (
          <>
            {/* Mobile Header with Back Button */}
            <div className="md:hidden sticky top-0 z-10 bg-white border-b px-3 py-2 flex items-center gap-2">
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 rounded-lg -ml-2"
                aria-label="Back to notes"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-semibold truncate flex-1">
                {isEditing ? 'Editing' : selectedNote.title}
              </h2>
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop ACTION BAR */}
            <div className="hidden md:flex sticky top-0 z-10 bg-white border-b p-4 justify-between items-center gap-3 shadow-sm">
              {isEditing ? (
                <input
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="text-xl font-bold w-full border-b-2 border-blue-600 outline-none pb-1 bg-transparent"
                  placeholder="Note Title"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold truncate">{selectedNote.title}</h2>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote()}
                      disabled={isSaving}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(selectedNote.id, e)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      aria-label="Delete note"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <div className="p-4 md:p-6 h-full">
                  {/* Mobile Title Input */}
                  <input
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    className="md:hidden w-full text-2xl font-bold border-b-2 border-blue-600 outline-none pb-2 mb-4 bg-transparent"
                    placeholder="Note Title"
                  />
                  
                  <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="w-full h-full p-4 md:p-3 outline-none resize-none bg-white md:rounded-lg md:shadow-sm text-base"
                    placeholder="Write your note here…"
                    style={{ minHeight: '300px' }}
                  />
                </div>
              ) : (
                <div className="p-4 md:p-6">
                  <div className="bg-white rounded-lg md:shadow-sm p-4 md:p-6 prose max-w-none min-h-[300px]">
                    {selectedNote.content ? (
                      <div className="whitespace-pre-wrap text-base leading-relaxed">{selectedNote.content}</div>
                    ) : (
                      <p className="text-gray-400 italic">This note is empty</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="md:hidden sticky bottom-0 bg-white border-t p-3 flex gap-2 safe-area-bottom">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveNote()}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg active:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg active:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <Edit className="h-5 w-5" />
                    Edit Note
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(selectedNote.id, e)}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg active:bg-red-700 transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
            <Book className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No note selected</p>
            <p className="text-sm mb-4">Select a note from the sidebar</p>
            <button
              onClick={handleNewNote}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}