'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, ArrowRight, X, Shuffle, RefreshCcw } from 'lucide-react';

interface Term {
    id: number;
    term: string;
    definition: string;
}

interface StudySet {
    id: number;
    title: string;
    terms: Term[];
}

export default function LearnPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const setId = parseInt(id as string, 10);

    const [studySet, setStudySet] = useState<StudySet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shuffledTerms, setShuffledTerms] = useState<Term[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (isNaN(setId)) return notFound();

        const fetchStudySet = async () => {
            try {
                const response = await fetch(`/api/study-sets/${setId}`);
                if (!response.ok) {
                    if(response.status === 404) notFound();
                    throw new Error('Failed to fetch study set.');
                }
                const data = await response.json();
                setStudySet(data);
                setShuffledTerms(shuffleArray([...data.terms])); 
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudySet();
    }, [setId]);

    const shuffleArray = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const handleNext = () => {
        if (currentIndex < shuffledTerms.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleShuffle = () => {
        setIsFlipped(false);
        setCurrentIndex(0);
        setShuffledTerms(shuffleArray([...(studySet?.terms || [])]));
    };
    
    const handleRestart = () => {
        setIsFlipped(false);
        setCurrentIndex(0);
    };
    
    const currentTerm = useMemo(() => shuffledTerms[currentIndex], [shuffledTerms, currentIndex]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (error || !studySet || !currentTerm) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900 text-red-400">
                Error: {error || 'Could not load study set.'}
            </div>
        );
    }

    const progress = ((currentIndex + 1) / shuffledTerms.length) * 100;

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-8 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col h-full w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 w-full max-w-4xl mx-auto">
                 <div className="flex items-center gap-4">
                    <h1 className="text-xl md:text-2xl font-bold truncate">Learn: {studySet.title}</h1>
                </div>
                <button onClick={() => router.push(`/study-sets/${setId}`)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Progress Bar */}
             <div className="w-full max-w-4xl mx-auto mb-6">
                <div className="bg-gray-700 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                 <div className="text-center text-sm text-gray-400 mt-2">{currentIndex + 1} / {shuffledTerms.length}</div>
            </div>
            
            {/* Flashcard */}
            <div className="flex-grow flex items-center justify-center">
                 <div className="w-full max-w-4xl aspect-[3/2] [perspective:1000px]">
                    <div 
                        className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Front */}
                        <div className="absolute w-full h-full bg-gray-800 rounded-lg shadow-2xl flex items-center justify-center p-8 [backface-visibility:hidden]">
                            <p className="text-3xl md:text-5xl text-center font-semibold">{currentTerm.term}</p>
                        </div>
                        {/* Back */}
                        <div className="absolute w-full h-full bg-purple-900 rounded-lg shadow-2xl flex items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                            <p className="text-2xl md:text-4xl text-center font-medium">{currentTerm.definition}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xl mx-auto mt-8">
                 <button onClick={handleShuffle} title="Shuffle" className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"><Shuffle className="h-6 w-6" /></button>
                 <button onClick={handleRestart} title="Restart" className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"><RefreshCcw className="h-6 w-6" /></button>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowLeft className="h-7 w-7" /></button>
                    <button onClick={handleNext} disabled={currentIndex === shuffledTerms.length - 1} className="p-4 bg-gray-800 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ArrowRight className="h-7 w-7" /></button>
                </div>
            </div>
        </div>
    );
}
