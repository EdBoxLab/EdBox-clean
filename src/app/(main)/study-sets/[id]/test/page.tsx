'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Loader2, X, RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

// --- Types ---
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

interface Question {
    term: string;
    correctDefinition: string;
    options: string[];
}

interface Answer {
    questionTerm: string;
    selectedOption: string;
    isCorrect: boolean;
}

// --- Helper Functions ---
const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const generateQuestions = (terms: Term[]): Question[] => {
    if (terms.length < 4) return []; // Not enough terms for distractors

    return shuffleArray(terms).map(currentTerm => {
        const otherDefs = terms.filter(t => t.id !== currentTerm.id).map(t => t.definition);
        const distractors = shuffleArray(otherDefs).slice(0, 3);
        const options = shuffleArray([currentTerm.definition, ...distractors]);
        return {
            term: currentTerm.term,
            correctDefinition: currentTerm.definition,
            options,
        };
    });
};


// --- Component --- 
export default function TestPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const setId = parseInt(id as string, 10);

    const [studySet, setStudySet] = useState<StudySet | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (isNaN(setId)) return notFound();

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

                if (data.terms.length < 4) {
                    setError('This study set needs at least 4 terms to generate a test.');
                } else {
                    setQuestions(generateQuestions(data.terms));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudySet();
    }, [setId]);

    // --- Event Handlers ---
    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        const isCorrect = option === questions[currentQuestionIndex].correctDefinition;
        setAnswers([...answers, { questionTerm: questions[currentQuestionIndex].term, selectedOption: option, isCorrect }]);
        setIsAnswered(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsAnswered(false);
            setSelectedOption(null);
        } else {
            setShowResults(true);
        }
    };
    
    const handleRestart = () => {
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowResults(false);
        if(studySet) setQuestions(generateQuestions(studySet.terms));
    }

    // --- Render Logic ---
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader2 className="h-16 w-16 animate-spin text-purple-400" /></div>;
    }

    if (error) {
        return (
             <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-red-400">
                <p className="mb-4">Error: {error}</p>
                 <button onClick={() => router.push(`/study-sets/${setId}`)} className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors">
                    Go Back
                </button>
            </div>
        );
    }
    
    const score = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;

    if (showResults) {
        return (
             <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl text-center bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <h1 className="text-4xl font-bold mb-2">Test Complete!</h1>
                    <p className="text-gray-400 mb-6">You scored</p>
                    <p className="text-7xl font-bold text-purple-400 mb-8">{score} / {totalQuestions}</p>
                    <div className="flex gap-4 justify-center">
                         <button onClick={() => router.push(`/study-sets/${setId}`)} className="py-3 px-6 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors">
                            Done
                        </button>
                        <button onClick={handleRestart} className="py-3 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5"/>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!questions.length) {
         return <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-400">Generating test...</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

    return (
         <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 w-full max-w-4xl mx-auto">
                <h1 className="text-xl md:text-2xl font-bold truncate">Test: {studySet?.title}</h1>
                <button onClick={() => router.push(`/study-sets/${setId}`)} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Progress Bar */}
             <div className="w-full max-w-4xl mx-auto mb-6">
                <div className="bg-gray-700 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                 <div className="text-center text-sm text-gray-400 mt-2">Question {currentQuestionIndex + 1} of {totalQuestions}</div>
            </div>

            {/* Question Area */}
            <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full text-center mb-8">
                    <p className="text-2xl md:text-4xl font-semibold">{currentQuestion.term}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {currentQuestion.options.map((option, index) => {
                        const isCorrect = option === currentQuestion.correctDefinition;
                        let buttonClass = 'bg-gray-700 hover:bg-gray-600';
                        if (isAnswered && option === selectedOption) {
                            buttonClass = isCorrect ? 'bg-green-700' : 'bg-red-800';
                        }
                         if (isAnswered && isCorrect) {
                            buttonClass = 'bg-green-700/80';
                        }

                        return (
                            <button 
                                key={index} 
                                onClick={() => handleOptionSelect(option)} 
                                disabled={isAnswered}
                                className={`p-4 rounded-lg text-left transition-colors w-full h-full ${buttonClass}`}>
                                {option}
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className="mt-8 text-center">
                        <button onClick={handleNextQuestion} className="py-3 px-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">
                           {currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Finish'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
