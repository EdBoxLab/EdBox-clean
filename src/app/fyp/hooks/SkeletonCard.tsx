
import React from 'react';
import { SkeletonLoader } from './SkeletonLoader';

export const SkeletonCard: React.FC = () => {
    // Pick a random gradient to make the skeletons feel varied
    const gradients = [
        'from-purple-800/50 to-indigo-900/50',
        'from-blue-800/50 to-cyan-900/50',
        'from-emerald-800/50 to-teal-900/50',
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    return (
        <div className="h-full w-full snap-start flex-shrink-0 p-2">
            <div className={`relative h-full w-full flex flex-col justify-between p-4 sm:p-6 text-white bg-gradient-to-br ${randomGradient} rounded-2xl`}>
                {/* Main Content Area */}
                <div className="flex-grow flex flex-col justify-center items-center">
                    <SkeletonLoader className="h-8 w-3/4 mb-8 rounded-md" />
                    <SkeletonLoader className="h-48 w-full rounded-lg" />
                    <SkeletonLoader className="h-6 w-1/2 mt-8 rounded-md" />
                </div>

                {/* Bottom UI */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex justify-between items-end">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <SkeletonLoader className="w-12 h-12 sm:w-14 sm:h-14 rounded-full" />
                        <div>
                            <SkeletonLoader className="h-5 w-24 mb-2 rounded-md" />
                            <SkeletonLoader className="h-4 w-32 rounded-md" />
                        </div>
                    </div>
                    <SkeletonLoader className="h-8 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
};
