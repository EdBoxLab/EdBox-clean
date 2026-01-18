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
Sparkles,
Wand2,
} from 'lucide-react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
const { isPremium } = useSubscription();
const [aiInstructions, setAiInstructions] = useState('');
const [isGenerating, setIsGenerating] = useState(false);

/* ================= AI LOGIC ================= */
const handleGenerateAI = async (isMore: boolean = false) => {
if (!isPremium) return;
setIsGenerating(true);
try {
const res = await fetch('/api/notes/generate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
currentContent: editedContent,
instructions: aiInstructions,
isMore,
}),
});
const data = await res.json();
if (isMore) {
setEditedContent(prev => prev + '\n\n' + data.content);
} else {
setEditedContent(data.content);
}
setIsEditing(true);
} catch (err) {
setError('AI Generation failed');
} finally {
setIsGenerating(false);
}
};

/* ================= DATA ================= */


  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes');
if (!res.ok) throw new Error();
const data = await res.json();
// Handle both array and object response
const notesData = Array.isArray(data) ? data : (data.notes || []);
if (active) setNotes(notesData);
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
    <div className="relative flex h-full lg:border lg:rounded-lg overflow-hidden">

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
        <aside className="w-full lg:w-80 border-r bg-white flex flex-col">
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

          {/* HEADER WITH ACTION BUTTONS */}
          <div className="sticky top-0 z-10 bg-white border-b p-3 flex items-center gap-2">
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
                  className="px-2 py-1.5 text-xs bg-gray-200 rounded-md hover:bg-gray-300 active:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-2 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="h-3 w-3" strokeWidth={2} />
                  {isSaving ? 'Saving' : 'Save'}
                </button>
              </div>
            )}
          </div>

{/* CONTENT */}
<div className="flex-1 overflow-y-auto p-4 space-y-4">
{isPremium && isEditing && (
<div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
<div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
<Sparkles className="h-4 w-4" />
Premium AI Assistant
</div>
<Textarea
placeholder="Specify what should be in your notes (e.g., 'Focus on the structural differences between plant and animal cells', 'Use a professional tone', 'Add a summary at the end')"
value={aiInstructions}
onChange={e => setAiInstructions(e.target.value)}
className="bg-white border-blue-200 focus:ring-blue-500 min-h-[80px]"
/>
<div className="flex gap-2">
<Button
onClick={() => handleGenerateAI(false)}
disabled={isGenerating}
className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
>
    {isGenerating ? 'Generating...' : 'Regenerate with AI'}
</Button>
<Button
onClick={() => handleGenerateAI(true)}
disabled={isGenerating}
variant="outline"
className="border-blue-200 text-blue-700 hover:bg-blue-100 flex-1"
>
<Wand2 className="h-4 w-4 mr-2" />
Generate More
</Button>
</div>
</div>
)}
{isEditing ? (
<textarea
ref={textareaRef}
value={editedContent}
onChange={e => setEditedContent(e.target.value)}
className="w-full min-h-[400px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Write your note…"
/>
) : (
<div className="bg-white rounded-lg p-6 prose prose-slate max-w-none
  prose-headings:text-gray-900 prose-headings:font-bold
  prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3 prose-h1:mb-4
  prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-blue-800
  prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-gray-700
  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-3
  prose-ul:my-3 prose-ul:space-y-1
  prose-ol:my-3 prose-ol:space-y-1
  prose-li:text-gray-700 prose-li:marker:text-blue-500
  prose-strong:text-gray-900 prose-strong:font-semibold
  prose-em:text-gray-600
  prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:italic prose-blockquote:text-gray-600
  prose-code:bg-gray-100 prose-code:text-pink-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:p-0 prose-pre:my-4
  prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
  prose-hr:border-gray-200 prose-hr:my-6
">
{selectedNote.content ? (
  <ReactMarkdown
    components={{
      code({ node, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const isInline = !match && !className;
        return isInline ? (
          <code className={className} {...props}>
            {children}
          </code>
        ) : (
          <SyntaxHighlighter
            style={oneLight}
            language={match ? match[1] : 'text'}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      },
    }}
  >
    {selectedNote.content}
  </ReactMarkdown>
) : (
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