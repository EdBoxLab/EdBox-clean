'use client';

import dynamic from 'next/dynamic';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import SourceMapErrorBoundary from './components/SourceMapErrorBoundary';
import ComponentLoader from './components/ComponentLoader';

// Dynamically import SkillGraphRenderer with enhanced error handling
const SkillGraphRenderer = dynamic(() => import('./SkillGraphRenderer'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading skill graph...</p>
            </div>
        </div>
    ),
});

interface Props {
    graph: SkillGraph;
    challenges: Record<string, Challenge>;
}

export default function SkillGraphWrapper({ graph, challenges }: Props) {
    return (
        <SourceMapErrorBoundary>
            <ComponentLoader>
                <SkillGraphRenderer graph={graph} challenges={challenges} />
            </ComponentLoader>
        </SourceMapErrorBoundary>
    );
}
