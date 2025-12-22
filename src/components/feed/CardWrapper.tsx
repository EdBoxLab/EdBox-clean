import React from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ThumbsUpIcon, ShareIcon } from './MediaIcons';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

const cardBaseClass = 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600';

export const CardWrapper: React.FC<CardWrapperProps> = ({ item, isActive, onSwipe, children, onFeedback }) => {
    const handleShare = async () => {
        const shareData = {
            title: item.title,
            text: `Check out this ${item.type} on EdBox: ${item.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert('Link copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy info:', err);
            }
        }
    };

    const getFeedbackButtonClass = (type: Feedback) => {
        if (item.feedback) {
            if (item.feedback === type) {
                return type === 'like' ? 'text-green-400' : 'text-red-400';
            }
            return 'text-gray-600 cursor-not-allowed';
        }
        return 'text-white hover:bg-zinc-700/50 cursor-pointer';
    };

    const scale = isActive ? 1.02 : 1;

    return (
        <div
            className={`relative h-full w-full flex flex-col justify-between p-4 sm:p-6 text-white ${cardBaseClass} overflow-hidden rounded-xl transition-all duration-300 ${isActive ? 'border-zinc-400 shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-zinc-900/80 ring-1 ring-white/10' : 'scale-[0.98] grayscale opacity-60'}`}
        >
            {/* Sidebar Interactions (TikTok Style) */}
            <div className="absolute right-2 sm:right-4 bottom-20 sm:bottom-24 flex flex-col gap-5 sm:gap-6 z-30 items-center pointer-events-none">
                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button
                        onClick={() => onFeedback(item.id, 'like')}
                        className={`p-2 sm:p-3 rounded-full bg-zinc-800/50 backdrop-blur-md border border-white/10 transition-all ${getFeedbackButtonClass('like')}`}
                    >
                        <ThumbsUpIcon filled={item.feedback === 'like'} className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">Like</span>
                </div>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button
                        onClick={handleShare}
                        className="p-2 sm:p-3 rounded-full bg-zinc-800/50 backdrop-blur-md border border-white/10 text-white transition-all"
                    >
                        <ShareIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">Share</span>
                </div>
            </div>

            {/* Main Content Area - Interactive elements enabled */}
            <div className="flex-grow flex flex-col justify-center items-center z-20 w-full pointer-events-auto cursor-default">
                {children}
            </div>

            {/* Bottom Section: Metadata & Actions */}
            <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-4 right-12 sm:right-16 z-30 pointer-events-none flex flex-col gap-3 sm:gap-4">
                {/* Metadata (TikTok Style) */}
                <div className="space-y-1">
                    {item.courseReference && (
                        <div className="flex items-center gap-1 mb-1">
                            <ArrowRight className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Related to {item.courseReference}</span>
                        </div>
                    )}
                    <p className="font-bold text-white text-sm sm:text-base">@{item.topic.toLowerCase().replace(/\s+/g, '')}</p>
                    <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 leading-relaxed">{item.title}</p>
                </div>

            </div>
        </div>
    );
};
// End of CardWrapper