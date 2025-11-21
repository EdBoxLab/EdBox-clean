
import React from 'react';
import type { ImageGenerationState } from './types';
import { VideoErrorIcon } from './MediaIcons';
import { SkeletonLoader } from './hooks/SkeletonLoader';

interface CardImageProps {
  generationState?: ImageGenerationState;
  imageUrl?: string;
  altText: string;
}

export const CardImage: React.FC<CardImageProps> = ({ generationState, imageUrl, altText }) => {
  if (!generationState) {
    return null;
  }

  const renderContent = () => {
    switch (generationState) {
      case 'ready':
        return <img src={imageUrl} alt={altText} className="w-full h-full object-cover" />;
      case 'generating':
      case 'pending':
        return (
            <SkeletonLoader className="w-full h-full" />
        );
      case 'error':
        return (
          <div className="w-full h-full bg-gray-700/50 flex flex-col items-center justify-center text-center p-2">
            <VideoErrorIcon />
            <p className="text-xs text-gray-300 mt-1">Image load error</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full aspect-video bg-gray-900">
        {renderContent()}
    </div>
  );
};
