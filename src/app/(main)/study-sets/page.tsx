'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Book, Trash2, Edit } from 'lucide-react';

interface StudySet {
    id: number;
    title: string;
    description: string;
}

export default function MyStudySetsPage() {
    const router = useRouter();
    const [studySets, setStudySets] = useState<StudySet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMySets = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/my-study-sets');
            if (!response.ok) {
                throw new Error('Failed to fetch your study sets.');
            }
            const data = await response.json();
            setStudySets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMySets();
    }, [fetchMySets]);

    const handleDelete = async (setId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this study set?')) return;

        try {
            const response = await fetch(`/api/study-sets/${setId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to delete study set.');
            }
            // Refresh the list after deletion
            setStudySets(prevSets => prevSets.filter(set => set.id !== setId));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    const handleEdit = (setId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation
        router.push(`/study-sets/${setId}/edit`);
    };

    const navigateToSet = (setId: number) => {
        router.push(`/study-sets/${setId}`);
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center py-20"><Loader2 className="h-12 w-12 animate-spin text-purple-400" /></div>;
        }

        if (error) {
            return <div className="text-center text-red-400 py-20">Error: {error}</div>;
        }

        if (studySets.length === 0) {
            return (
                <div className="text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-16">
                    <Book className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-2xl font-semibold text-white">No Study Sets Yet</h3>
                    <p className="mt-2">Click the button above to create your first study set!</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studySets.map(set => (
                    <div key={set.id} onClick={() => navigateToSet(set.id)} className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-purple-500/20 hover:bg-gray-700 transition-all cursor-pointer flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 truncate">{set.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-3">{set.description}</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
                            <button onClick={(e) => handleEdit(set.id, e)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"><Edit className="h-5 w-5" /></button>
                            <button onClick={(e) => handleDelete(set.id, e)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors"><Trash2 className="h-5 w-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold">My Study Sets</h1>
                    <button onClick={() => router.push('/study-sets/new/edit')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg flex items-center transition-colors shadow-lg">
                        <Plus className="h-5 w-5 mr-2"/>
                        Create Set
                    </button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
