import React, { useState } from 'react';
import type { ImageGenerationState } from '@/types/feed';
import { VideoErrorIcon } from './MediaIcons';
import { SkeletonLoader } from './SkeletonLoader';

interface CardImageProps {
    generationState?: ImageGenerationState;
    imageUrl?: string;
    altText: string;
}

export const CardImage: React.FC<CardImageProps> = ({ generationState, imageUrl, altText }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!generationState) {
        return null;
    }

    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const renderContent = () => {
        switch (generationState) {
            case 'ready':
                return (
                    <>
                        {isLoading && !hasError && (
                            <SkeletonLoader className="absolute inset-0 w-full h-full" />
                        )}
                        {!hasError ? (
                            <img 
                                src={imageUrl} 
                                alt={altText} 
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                loading="eager"
                            />
                        ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="text-2xl">📚</span>
                                </div>
                            </div>
                        )}
                    </>
                );
            case 'generating':
            case 'pending':
                return (
                    <SkeletonLoader className="absolute inset-0 w-full h-full" />
                );
            case 'error':
                return (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex flex-col items-center justify-center text-center p-4">
                        <VideoErrorIcon />
                        <p className="text-xs text-gray-400 mt-2">Image unavailable</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden">
            {renderContent()}
        </div>
    );
};
