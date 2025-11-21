'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, BookCheck } from 'lucide-react';

interface StudySet {
    id: number;
    title: string;
    description: string;
}

interface ShareSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShare: (studySetId: number) => Promise<void>;
    circleId: number;
}

export default function ShareSetModal({ isOpen, onClose, onShare, circleId }: ShareSetModalProps) {
    const [mySets, setMySets] = useState<StudySet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSet, setSelectedSet] = useState<number | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchMySets = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch('/api/my-study-sets');
                    if (!response.ok) {
                        throw new Error('Failed to fetch your study sets.');
                    }
                    const data = await response.json();
                    setMySets(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'An unknown error occurred');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMySets();
        }
    }, [isOpen]);

    const handleShare = async () => {
        if (!selectedSet) return;
        setIsSharing(true);
        setError(null);
        try {
            await onShare(selectedSet);
            // Reset after successful share
            setSelectedSet(null);
            onClose(); 
        } catch(err) {
             setError(err instanceof Error ? err.message : 'An unknown error occurred during share');
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold mb-4 text-white">Share a Study Set</h2>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-purple-400"/></div>
                ) : error ? (
                    <div className="text-red-400 bg-red-900/50 p-4 rounded-lg">Error: {error}</div>
                ) : mySets.length === 0 ? (
                     <div className="text-center text-gray-400 border-2 border-dashed border-gray-700 rounded-lg p-12">
                        <h3 className="text-lg font-semibold">No Study Sets Found</h3>
                        <p>You haven't created any study sets yet. Create one to share it!</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {mySets.map(set => (
                            <div
                                key={set.id}
                                onClick={() => setSelectedSet(set.id)}
                                className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedSet === set.id ? 'border-purple-500 bg-purple-900/50' : 'border-gray-700 bg-gray-700/50 hover:border-purple-600'}`}>
                                <div className="flex justify-between items-center">
                                     <div>
                                        <p className="font-bold text-lg text-white">{set.title}</p>
                                        <p className="text-sm text-gray-400 line-clamp-2">{set.description}</p>
                                    </div>
                                    {selectedSet === set.id && <BookCheck className="h-6 w-6 text-purple-400 flex-shrink-0 ml-4" />} 
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-4">
                     {error && !isLoading && <p className="text-sm text-red-400 self-center mr-auto">{error}</p>}
                    <button onClick={onClose} className="py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">Cancel</button>
                    <button 
                        onClick={handleShare}
                        disabled={!selectedSet || isSharing}
                        className="py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center w-36"
                    >
                        {isSharing ? <Loader2 className="h-5 w-5 animate-spin"/> : 'Share Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
