import React from 'react';
import type { MemeFeedItem } from '@/types/feed';
import { CardImage } from './CardImage';

interface MemeCardProps {
    item: MemeFeedItem;
}

export const MemeCard: React.FC<MemeCardProps> = ({ item }) => {
    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-2">
            <div className="relative w-full max-w-[95%] sm:max-w-md rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10">
                {/* Image Container */}
                <div className="relative w-full aspect-square sm:aspect-video">
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />

                    {/* Meme Overlays - Only show if image is ready to simulate real meme feel */}
                    {item.imageGenerationState === 'ready' && (
                        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase text-stroke-black drop-shadow-md text-center leading-tight">
                                {item.top_text}
                            </h2>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase text-stroke-black drop-shadow-md text-center leading-tight">
                                {item.bottom_text}
                            </h2>
                        </div>
                    )}
                </div>
            </div>

            {/* Concept Context */}
            <div className="mt-6 sm:mt-8 max-w-sm px-4 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-gray-300 uppercase tracking-wider mb-1">Learning Concept</p>
                <p className="font-bold text-lg text-yellow-300">{item.concept}</p>
            </div>

            {/* Styles for meme text outline */}
            <style>{`
            .text-stroke-black {
                -webkit-text-stroke: 2px black;
                text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
            }
        `}</style>
        </div>
    );
};
