'use client';

import { useState, useEffect } from 'react';
import { Plus, Book, Trash, Edit, Save } from 'lucide-react';
import { ViewNoteDialog } from '@/components/view-note-dialog';

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setNotes(data);
    };
    fetchNotes();
  }, []);

  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setEditedContent(note.content);
    setIsEditing(false);
  };

  const handleNewNote = async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Note', content: '' }),
    });
    const newNote = await res.json();
    setNotes([newNote[0], ...notes]);
    setSelectedNote(newNote[0]);
    setEditedContent('');
    setIsEditing(true);
  };

  const handleDeleteNote = async (id: any) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(notes.filter((note) => note.id !== id));
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(null);
    }
  };

  const handleSaveNote = async () => {
    const res = await fetch(`/api/notes/${selectedNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: selectedNote.title, content: editedContent }),
    });
    const updatedNote = await res.json();
    setNotes(
      notes.map((note) =>
        note.id === selectedNote.id ? updatedNote[0] : note
      )
    );
    setSelectedNote(updatedNote[0]);
    setIsEditing(false);
  };

  return (
    <div className="flex h-full border rounded-lg">
      {/* Notes List */}
      <div className="w-1/4 border-r overflow-y-auto">
        <div className="p-4">
          <button
            onClick={handleNewNote}
            className="w-full flex items-center justify-center p-2 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Note
          </button>
          <ul>
            {notes.map((note) => (
              <li
                key={note.id}
                className={`p-2 rounded-lg ${
                  selectedNote?.id === note.id ? 'bg-gray-200' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div onClick={() => handleSelectNote(note)} className="cursor-pointer flex-grow">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {note.content}
                    </p>
                  </div>
                  <ViewNoteDialog note={note} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Note Editor */}
      <div className="w-3/4 p-4">
        {selectedNote ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <button
                  title='save-button'
                    onClick={handleSaveNote}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                  title='edit-button'
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                )}
                <button
                  title='delete-button'
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
              title='edited-content'
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-2 border rounded-lg"
              />
            ) : (
              <div className="prose max-w-none">
                {selectedNote.content}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Book className="h-12 w-12 mb-4" />
            <p>Select a note to view or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
