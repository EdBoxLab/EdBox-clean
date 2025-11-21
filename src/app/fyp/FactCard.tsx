import React from 'react';
import type { FactFeedItem } from './types';
import { CardImage } from './CardImage';

interface FactCardProps {
  item: FactFeedItem;
}

export const FactCard: React.FC<FactCardProps> = ({ item }) => {
  return (
    <div className="w-full text-center flex flex-col justify-center items-center h-full px-2">
      <div className="w-full max-w-[90%] sm:max-w-sm mb-3 sm:mb-4 rounded-xl overflow-hidden shadow-lg">
        <CardImage 
          generationState={item.imageGenerationState}
          imageUrl={item.image_url}
          altText={item.title}
        />
      </div>
      <div className="w-full max-w-[90%] sm:max-w-sm p-3 sm:p-4 bg-black/20 rounded-b-xl">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 drop-shadow-lg">{item.title}</h2>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            {item.explanation}
        </p>
      </div>
    </div>
  );
};