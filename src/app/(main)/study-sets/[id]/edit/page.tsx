'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface Term {
    id?: number; // Not present on new terms
    term: string;
    definition: string;
}

interface StudySet {
    title: string;
    description: string;
    terms: Term[];
}

export default function StudySetEditPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const isNewSet = id === 'new';

    const [studySet, setStudySet] = useState<StudySet>({ title: '', description: '', terms: [{ term: '', definition: '' }] });
    const [isLoading, setIsLoading] = useState(!isNewSet);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isNewSet) {
            const fetchStudySet = async () => {
                try {
                    const response = await fetch(`/api/study-sets/${id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch study set data.');
                    }
                    const data = await response.json();
                    setStudySet(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStudySet();
        }
    }, [id, isNewSet]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setStudySet(prev => ({ ...prev, [name]: value }));
    };

    const handleTermChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newTerms = [...studySet.terms];
        newTerms[index] = { ...newTerms[index], [name]: value };
        setStudySet(prev => ({ ...prev, terms: newTerms }));
    };

    const addTerm = () => {
        setStudySet(prev => ({ ...prev, terms: [...prev.terms, { term: '', definition: '' }] }));
    };

    const removeTerm = (index: number) => {
        if (studySet.terms.length <= 1) return; // Must have at least one term
        const newTerms = studySet.terms.filter((_, i) => i !== index);
        setStudySet(prev => ({ ...prev, terms: newTerms }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        // Basic validation
        if (!studySet.title.trim() || !studySet.description.trim()) {
            setError('Title and description cannot be empty.');
            setIsSaving(false);
            return;
        }
        if (studySet.terms.some(t => !t.term.trim() || !t.definition.trim())) {
            setError('All terms and definitions must be filled out.');
            setIsSaving(false);
            return;
        }

        try {
            const url = isNewSet ? '/api/study-sets' : `/api/study-sets/${id}`;
            const method = isNewSet ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studySet),
            });

            if (!response.ok) {
                const { error: apiError } = await response.json();
                throw new Error(apiError || 'Failed to save study set.');
            }
            
            const { id: newId } = await response.json();
            router.push(`/study-sets/${newId || id}`); // Redirect to the view page

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader2 className="h-16 w-16 animate-spin text-purple-400" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between mb-8">
                         <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                            Back
                        </button>
                        <h1 className="text-3xl font-bold">{isNewSet ? 'Create Study Set' : 'Edit Study Set'}</h1>
                        <button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg flex items-center transition-colors shadow-lg disabled:bg-gray-500">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin"/> : <><Save className="h-5 w-5 mr-2"/><span>Save</span></>}
                        </button>
                    </div>

                    {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                        <h2 className="text-xl font-semibold mb-4">Main Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input type="text" name="title" id="title" value={studySet.title} onChange={handleInputChange} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                <textarea name="description" id="description" value={studySet.description} onChange={handleInputChange} rows={3} className="w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Terms ({studySet.terms.length})</h2>
                        <div className="space-y-4">
                            {studySet.terms.map((term, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-700/50 p-4 rounded-lg items-center">
                                    <input type="text" name="term" value={term.term} onChange={e => handleTermChange(index, e)} placeholder={`Term ${index + 1}`} className="w-full bg-gray-600 border-gray-500 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                                    <div className="flex items-center gap-2">
                                        <input type="text" name="definition" value={term.definition} onChange={e => handleTermChange(index, e)} placeholder={`Definition ${index + 1}`} className="w-full bg-gray-600 border-gray-500 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                                        <button type="button" onClick={() => removeTerm(index)} className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50" disabled={studySet.terms.length <= 1}>
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addTerm} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <Plus className="h-5 w-5 mr-2"/>
                            Add Term
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
