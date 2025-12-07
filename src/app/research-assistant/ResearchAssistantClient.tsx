'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { SourceUploader } from './SourceUploader';
import { ControlPanel } from './ChatInterface';
import { ResearchResults, SkeletonLoader } from './ArtifactRenderer';
import type { Source, ResearchPackage, CitationStyle } from '../types';
import { LogoIcon, PlusIcon, TrashIcon, ChevronLeftIcon } from './Icons';

type View = 'hub' | 'create' | 'results';

// --- Research Hub View ---
const ResearchHub: React.FC<{
    packages: ResearchPackage[];
    onNew: () => void;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
}> = ({ packages, onNew, onSelect, onDelete }) => {
    return (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-brand-text">My Research Library</h2>
                <button onClick={onNew} className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-brand-blue rounded-lg hover:bg-opacity-90 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> New Research
                </button>
            </div>
            {packages.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-md">
                    <LogoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Your Library is Empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Start a new research project to begin.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {packages.sort((a, b) => b.id - a.id).map(pkg => (
                        <div key={pkg.id} className="bg-white rounded-xl shadow-md p-4 group hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <button onClick={() => onSelect(pkg.id)} className="text-left flex-1">
                                    <h3 className="text-xl font-bold text-brand-text group-hover:text-brand-blue transition-colors">{pkg.title}</h3>
                                    <p className="text-sm text-brand-subtext mt-1 truncate">Goal: {pkg.goal}</p>
                                    <p className="text-xs text-gray-400 mt-2">{new Date(pkg.id).toLocaleString()}</p>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(pkg.id); }} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Research Creation View ---
const ResearchCreation: React.FC<{
    onBack: () => void;
    onPackageGenerated: (pkg: ResearchPackage) => void;
}> = ({ onBack, onPackageGenerated }) => {
    const [sources, setSources] = useState<Source[]>([]);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (goal: string, audience: string, citationStyle: CitationStyle) => {
        if (sources.length === 0) {
            setError("Please add at least one source document before generating.");
            return;
        }
        setError(null);
        setLoadingStatus('Generating research package...');

        try {
            const response = await fetch('/api/research-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ goal, audience, citationStyle, sources }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate research package');
            }

            const result = await response.json();

            const newPackage: ResearchPackage = {
                id: Date.now(),
                goal: goal,
                audience: audience,
                citationStyle: citationStyle,
                sources: sources,
                title: result.title,
                summary: result.summary,
                flashcards: result.flashcards,
                quiz: result.quiz,
                image: result.image,
                audio_dialogue: result.audio_dialogue,
            };
            onPackageGenerated(newPackage);
        } catch (e) {
            console.error(e);
            setError(`Failed to generate research package. ${e instanceof Error ? e.message : String(e)}`);
            setLoadingStatus(null);
        }
    }, [sources, onPackageGenerated]);

    if (loadingStatus) {
        return (
            <div className="flex justify-center items-center h-full">
                <SkeletonLoader status={loadingStatus} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            <button onClick={onBack} className="lg:col-span-12 flex items-center text-sm font-medium text-brand-subtext hover:text-brand-text">
                <ChevronLeftIcon className="h-5 w-5 mr-1" /> Back to Library
            </button>
            <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
                <SourceUploader onSourcesChanged={setSources} />
            </aside>
            <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                        <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                            <span className="text-2xl" aria-hidden="true">&times;</span>
                        </button>
                    </div>
                )}
                <ControlPanel
                    onGenerate={handleGenerate}
                    isLoading={!!loadingStatus}
                    disabled={sources.length === 0}
                />
            </div>
        </div>
    );
};


// --- Main App Component ---
const ResearchAssistantPage: React.FC = () => {
    const [view, setView] = useState<View>('hub');
    const [researchHistory, setResearchHistory] = useState<ResearchPackage[]>([]);
    const [currentPackageId, setCurrentPackageId] = useState<number | null>(null);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('researchHistory');
            if (savedHistory) {
                setResearchHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error("Failed to load research history from localStorage", error);
            setResearchHistory([]);
        }
    }, []);

    useEffect(() => {
        try {
            const historyForStorage = researchHistory.map(pkg => {
                const pkgCopy = JSON.parse(JSON.stringify(pkg));
                if (pkgCopy.image) {
                    delete pkgCopy.image.image_base64;
                }
                if (pkgCopy.audio_dialogue) {
                    delete pkgCopy.audio_dialogue.audio_base64;
                }
                return pkgCopy;
            });
            localStorage.setItem('researchHistory', JSON.stringify(historyForStorage));
        } catch (error) {
            console.error("Failed to save research history to localStorage", error);
        }
    }, [researchHistory]);

    const handleAddPackage = (pkg: ResearchPackage) => {
        const newHistory = [...researchHistory, pkg];
        setResearchHistory(newHistory);
        setCurrentPackageId(pkg.id);
        setView('results');
    };

    const handleDeletePackage = (id: number) => {
        const newHistory = researchHistory.filter(p => p.id !== id);
        setResearchHistory(newHistory);
    };

    const handleSelectPackage = (id: number) => {
        setCurrentPackageId(id);
        setView('results');
    };

    const currentPackage = researchHistory.find(p => p.id === currentPackageId);

    const renderContent = () => {
        switch (view) {
            case 'hub':
                return <ResearchHub packages={researchHistory} onNew={() => setView('create')} onSelect={handleSelectPackage} onDelete={handleDeletePackage} />;
            case 'create':
                return <ResearchCreation onBack={() => setView('hub')} onPackageGenerated={handleAddPackage} />;
            case 'results':
                return currentPackage ? (
                    <div className="animate-fade-in">
                        <button onClick={() => setView('hub')} className="mb-4 flex items-center text-sm font-medium text-brand-subtext hover:text-brand-text">
                            <ChevronLeftIcon className="h-5 w-5 mr-1" /> Back to Library
                        </button>
                        <ResearchResults pkg={currentPackage} />
                    </div>
                ) : null;
            default: return null;
        }
    };

    return (
        <div className="min-h-full flex flex-col font-sans">
            <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default ResearchAssistantPage;
