import React from 'react';

export const SkeletonCard = () => (
    <div className="flex-shrink-0 w-64 h-40 border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="flex-grow">
                <div className="h-3 bg-zinc-700 rounded w-16 mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-40"></div>
            </div>
            <div className="w-8 h-8 bg-zinc-700 rounded"></div>
        </div>
        <div className="h-3 bg-zinc-700 rounded w-24 mt-6"></div>
    </div>
);
