'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Edit, BrainCircuit, ClipboardCheck } from 'lucide-react';

interface Term {
    id: number;
    term: string;
    definition: string;
}

interface StudySet {
    id: number;
    title: string;
    description: string;
    terms: Term[];
    user: {
        username: string;
    };
}

export default function StudySetViewPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const setId = parseInt(id as string, 10);

    const [studySet, setStudySet] = useState<StudySet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isNaN(setId)) {
            return notFound();
        }

        const fetchStudySet = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/study-sets/${setId}`);
                if (!response.ok) {
                     if (response.status === 404) notFound();
                    throw new Error('Failed to fetch study set.');
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
    }, [setId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader2 className="h-16 w-16 animate-spin text-purple-400" /></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-red-400">Error: {error}</div>;
    }

    if (!studySet) {
        return null; // Should be handled by notFound()
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                     <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                        <ArrowLeft className="h-5 w-5" />
                        Back
                    </button>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h1 className="text-4xl font-bold text-white mb-2">{studySet.title}</h1>
                        <p className="text-gray-400 text-lg mb-4">{studySet.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Created by <span className="font-semibold text-purple-400">{studySet.user.username}</span></span>
                             <button onClick={() => router.push(`/study-sets/${studySet.id}/edit`)} className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors">
                                <Edit className="h-4 w-4"/>
                                Edit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center text-lg transition-colors shadow-lg">
                        <BrainCircuit className="h-6 w-6 mr-3"/>
                        Learn Mode
                    </button>
                     <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center text-lg transition-colors shadow-lg">
                        <ClipboardCheck className="h-6 w-6 mr-3"/>
                        Test Mode
                    </button>
                </div>

                {/* Terms List */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Terms ({studySet.terms.length})</h2>
                    <div className="space-y-3">
                        {studySet.terms.map(term => (
                            <div key={term.id} className="grid grid-cols-12 gap-4 bg-gray-700/50 p-4 rounded-lg">
                                <div className="col-span-5 font-medium text-white">{term.term}</div>
                                <div className="col-span-1 text-center text-gray-500">-</div>
                                <div className="col-span-6 text-gray-300">{term.definition}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
