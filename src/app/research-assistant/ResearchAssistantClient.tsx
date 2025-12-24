'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SourceUploader } from './SourceUploader';
import { ControlPanel } from './ChatInterface';
import { ResearchResults, SkeletonLoader } from './ArtifactRenderer';
import type { Source, ResearchPackage, CitationStyle } from '../types';
import { Plus, Trash2, ChevronLeft, BookOpen, Search, FileText } from 'lucide-react';

type View = 'hub' | 'create' | 'results';

// --- Research Hub View ---
const ResearchHub: React.FC<{
    packages: ResearchPackage[];
    onNew: () => void;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
}> = ({ packages, onNew, onSelect, onDelete }) => {
    return (
        <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                        Research Assistant
                    </h2>
                    <p className="text-zinc-400">Manage your research projects and sources</p>
                </div>
                <button
                    onClick={onNew}
                    className="flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Plus className="h-5 w-5 mr-2" /> New Research
                </button>
            </div>

            {packages.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white">Your Library is Empty</h3>
                    <p className="mt-2 text-zinc-500">Start a new research project to begin analyzing sources.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.sort((a, b) => b.id - a.id).map(pkg => (
                        <div
                            key={pkg.id}
                            onClick={() => onSelect(pkg.id)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 group hover:border-blue-500/50 hover:bg-zinc-900 transition-all cursor-pointer relative"
                        >
                            <div className="flex items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                                {pkg.title || 'Untitled Research'}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">Goal: {pkg.goal}</p>

                            <div className="flex items-center text-xs text-zinc-500 pt-4 border-t border-zinc-800">
                                <span>{new Date(pkg.id).toLocaleDateString()}</span>
                                <span className="mx-2">•</span>
                                <span>{pkg.sources.length} Sources</span>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(pkg.id); }}
                                className="absolute bottom-2 right-2 p-2.5 bg-zinc-900/90 hover:bg-red-500 text-zinc-500 hover:text-white rounded-full border border-zinc-800 hover:border-red-500 transition-all shadow-lg z-10"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
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
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                <SkeletonLoader status={loadingStatus} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors group"
            >
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Library
            </button>

            <div className="mb-8">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                    Create Research Package
                </h2>
                <p className="text-zinc-400">Upload sources and generate comprehensive research materials</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <SourceUploader onSourcesChanged={setSources} />
                </aside>

                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl relative backdrop-blur-sm" role="alert">
                            <span className="block sm:inline">{error}</span>
                            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 hover:bg-red-500/20 rounded-r-xl transition-colors">
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                    )}

                    <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Research Configuration</h3>
                                <p className="text-sm text-zinc-400">Set your research goals and preferences</p>
                            </div>
                        </div>
                        <ControlPanel
                            onGenerate={handleGenerate}
                            isLoading={!!loadingStatus}
                            disabled={sources.length === 0}
                        />
                    </div>
                </div>
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
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
                        <button
                            onClick={() => setView('hub')}
                            className="mb-6 flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" /> Back to Library
                        </button>
                        <ResearchResults pkg={currentPackage} />
                    </div>
                ) : null;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white font-sans">
            {renderContent()}
        </div>
    );
};

export default ResearchAssistantPage;