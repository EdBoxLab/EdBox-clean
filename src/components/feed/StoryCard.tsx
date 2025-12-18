import React, { useState } from 'react';
import type { StoryFeedItem } from '@/types/feed';
import { ChevronLeftIcon, ChevronRightIcon, FinishIcon } from './MediaIcons';

interface StoryCardProps {
    item: StoryFeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'got_it' | 'answered', xp?: number) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ item, isActive, onSwipe }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const totalSlides = item.slides.length;
    const isLastSlide = currentSlide === totalSlides - 1;

    const handleNext = () => {
        if (isLastSlide) {
            onSwipe(item.id, 'got_it', item.xp_reward);
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
    };

    const slide = item.slides[currentSlide];
    const slideText = typeof slide === 'string' ? slide : slide.text;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative text-white px-2 sm:px-4">
            {/* Progress Bar */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                {item.slides.map((_, index) => (
                    <div
                        key={index}
                        className="h-1 flex-1 rounded-full"
                        style={{
                            backgroundColor: index <= currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
                            transition: 'background-color 0.3s ease-in-out',
                        }}
                    />
                ))}
            </div>


            {/* Text Content Container (no images) */}
            <div className="relative w-full max-w-[90%] sm:max-w-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-2xl shadow-lg p-6 sm:p-8 flex items-center justify-center group border border-purple-500/20">
                {/* Story Text */}
                <div className="text-center">
                    <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-100">
                        {slideText}
                    </p>
                </div>

                {/* Navigation Overlays */}
                {currentSlide > 0 && (
                    <div
                        className="absolute left-0 top-0 h-full w-1/3 z-10 cursor-pointer"
                        onClick={handlePrev}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        role="button"
                        aria-label="Previous slide"
                    />
                )}
                <div
                    className="absolute right-0 top-0 h-full w-1/3 z-10 cursor-pointer"
                    onClick={handleNext}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    role="button"
                    aria-label={isLastSlide ? "Finish story" : "Next slide"}
                />

                {/* Navigation Icons (visible on hover/active) */}
                {currentSlide > 0 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <ChevronLeftIcon />
                    </div>
                )}

                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {isLastSlide ? <FinishIcon /> : <ChevronRightIcon />}
                </div>
            </div>

            <p className="mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm z-20">
                {isLastSlide ? 'Tap right to finish! 🎉' : `${currentSlide + 1} / ${totalSlides}`}
            </p>
        </div>
    );
};