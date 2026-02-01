import React from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ArrowRight, Share2, ThumbsUp, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardImage } from './CardImage';

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
    item,
    isActive,
    onSwipe,
    children,
    onFeedback
}) => {
    const handleShare = async () => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const shareUrl = `${baseUrl.replace(/\/$/, '')}/feed?id=${item.id}`;

        const shareData = {
            title: item.title,
            text: `Check out this ${item.type} on EdBox: ${item.title}`,
            url: shareUrl,
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
                console.error('Failed to copy:', err);
            }
        }
    };

    const handleSave = async () => {
        onFeedback(item.id, 'save');

        try {
            const response = await fetch('/api/feed/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feed_item_id: item.id,
                    feed_item_type: item.type,
                    content: item
                })
            });

            if (!response.ok) throw new Error('Failed to save');
        } catch (err) {
            console.error('Error saving item:', err);
        }
    };

    const isLiked = item.feedback === 'like';
    const isSaved = item.isSavedByUser;
    const isMediaType = item.type === 'media';

    return (
        <div
            className={`relative h-full w-full flex flex-col bg-black rounded-3xl overflow-hidden transition-all duration-500 ${isActive
                ? 'border border-white/10 shadow-2xl'
                : 'scale-[0.98] opacity-80' /* Increased opacity for inactive cards */
                }`}
        >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <CardImage
                    generationState={item.imageGenerationState || 'ready'}
                    imageUrl={item.imageUrl}
                    altText={item.title}
                />
                {/* Stronger gradient for text readability and less transparency feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black z-10" />
            </div>

            {/* Main Content - Padded to avoid overlap with right sidebar and bottom text */}
            <div className={`relative flex-1 flex items-center justify-center z-30 pl-4 pr-16 pb-40 ${isMediaType ? '' : ''}`}>
                {children}
            </div>

            {/* Right Sidebar - Vertical Actions - High Z-Index & Pointer Events */}
            <div className="absolute right-2 bottom-20 z-50 flex flex-col items-center gap-6 pointer-events-auto">
                {/* Like */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFeedback(item.id, 'like');
                        }}
                        className={`p-3 rounded-full transition-all duration-300 ${isLiked
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-black/40 text-white hover:bg-black/60'
                            } backdrop-blur-md border border-white/10 active:scale-95 touch-manipulation`}
                    >
                        <ThumbsUp className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">
                        {item.likes > 0 ? item.likes : 'Like'}
                    </span>
                </div>

                {/* Save */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSave();
                        }}
                        className={`p-3 rounded-full transition-all duration-300 ${isSaved
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-black/40 text-white hover:bg-black/60'
                            } backdrop-blur-md border border-white/10 active:scale-95 touch-manipulation`}
                    >
                        <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">
                        Save
                    </span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShare();
                        }}
                        className="p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all duration-300 backdrop-blur-md border border-white/10 active:scale-95 touch-manipulation"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">
                        Share
                    </span>
                </div>

                {/* More Options */}
                <button className="p-3 rounded-full bg-black/40 text-white/70 hover:bg-black/60 transition-all duration-300 backdrop-blur-md border border-white/10 active:scale-95 touch-manipulation">
                    <MoreHorizontal className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Left - Title & Context Overlay - Reduced vertical footprint & softened gradient - Pointer Events None to pass clicks */}
            <div className="absolute bottom-0 left-0 right-16 z-40 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pointer-events-none">
                {item.courseReference && (
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                            <ArrowRight className="w-3 h-3 text-white/70" />
                            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                                {item.courseReference}
                            </span>
                        </div>
                    </div>
                )}

                <div className="mb-1">
                    <span className="text-sm font-bold text-purple-400 block mb-1">
                        @{item.topic.toLowerCase().replace(/\s+/g, '')}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                        {item.title}
                    </h3>
                </div>

                {item.xp_reward > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                        <span className="text-xs font-bold text-purple-300">+{item.xp_reward} XP</span>
                    </div>
                )}
            </div>
        </div>
    );
};