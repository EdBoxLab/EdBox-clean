'use client';

import React, { useState } from 'react';
import { Save, Download } from 'lucide-react';

export default function NotesPage() {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');

    const handleSave = () => {
        // TODO: Implement save to database
        console.log('Saving note:', { title, content });
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                            Note Taker
                        </h1>
                        <p className="text-zinc-400">Quick and simple note-taking</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 border border-zinc-700 hover:border-green-500 rounded-lg transition flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        <button className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-lg transition flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Note Editor */}
                <div className="border-2 border-zinc-700 bg-zinc-900/30 rounded-2xl p-6 space-y-4">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full bg-transparent border-b border-zinc-700 pb-3 text-2xl font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-green-500 transition"
                    />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start typing your notes..."
                        className="w-full h-[calc(100vh-300px)] bg-transparent text-white placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
}
