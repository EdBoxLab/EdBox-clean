
import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

export const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 min-h-[400px] flex flex-col justify-between">
            {/* Main Content Area */}
            <div className="flex-grow flex flex-col justify-center items-center">
                <SkeletonLoader className="h-8 w-3/4 mb-8 rounded-md" />
                <SkeletonLoader className="h-48 w-full rounded-lg" />
                <SkeletonLoader className="h-6 w-1/2 mt-8 rounded-md" />
            </div>

            {/* Bottom UI */}
            <div className="flex justify-between items-end mt-6">
                <div className="flex items-center space-x-3">
                    <div>
                        <SkeletonLoader className="h-5 w-24 mb-2 rounded-md" />
                        <SkeletonLoader className="h-4 w-32 rounded-md" />
                    </div>
                </div>
                <SkeletonLoader className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
};
