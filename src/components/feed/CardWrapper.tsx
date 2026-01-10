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

            {/* Main Content - Padded aggressively on mobile (pb-48) to clear metadata bar */}
            {/* Increased Z-INDEX to z-30 to ensure it's above the metadata bar (z-10) */}
            <div className={`relative flex-1 flex items-center justify-center z-30 px-4 sm:px-6 ${isMediaType ? '' : 'pb-48 sm:pb-32'}`}>
                {children}
            </div>

            {/* Bottom Metadata Bar - Lower z-index than content (z-10) */}
            {/* Entire container is pointer-events-none to prevent blocking main content clicks */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm pointer-events-none">
                <div className="px-4 sm:px-6 pb-6 pt-10 pointer-events-none">
                    {/* Course Reference Tag (if exists) */}
                    {item.courseReference && (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full w-fit mb-2">
                            <ArrowRight className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
                                {item.courseReference}
                            </span>
                        </div>
                    )}

                    {/* Topic + Title - Compact */}
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-purple-400 mb-1">
                            @{item.topic.toLowerCase().replace(/\s+/g, '')}
                        </p>
                        <p className="text-sm font-medium text-white/90 line-clamp-1">
                            {item.title}
                        </p>
                    </div>

                    {/* Action Buttons Row - Horizontal, Small */}
                    {/* Only buttons have pointer-events-auto */}
                    <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-3">
                            {/* Like */}
                            <button
                                onClick={() => onFeedback(item.id, 'like')}
                                className="flex items-center gap-1.5 group pointer-events-auto"
                            >
                                <div className={`p-2 rounded-full transition-colors ${isLiked
                                    ? 'bg-purple-500/20 border border-purple-500/40'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}>
                                    <ThumbsUp
                                        className={`w-4 h-4 transition-all ${isLiked
                                            ? 'text-purple-400 fill-purple-400'
                                            : 'text-white/70 group-hover:text-white'
                                            }`}
                                    />
                                </div>
                                {item.likes > 0 && (
                                    <span className="text-xs text-white/50 font-medium">
                                        {item.likes}
                                    </span>
                                )}
                            </button>

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                className="group pointer-events-auto"
                            >
                                <div className={`p-2 rounded-full transition-colors ${isSaved
                                    ? 'bg-blue-500/20 border border-blue-500/40'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}>
                                    <Bookmark
                                        className={`w-4 h-4 transition-all ${isSaved
                                            ? 'text-blue-400 fill-blue-400'
                                            : 'text-white/70 group-hover:text-white'
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                className="group pointer-events-auto"
                            >
                                <div className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <Share2 className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                                </div>
                            </button>
                        </div>

                        {/* XP Badge + More Options */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                            {item.xp_reward > 0 && (
                                <div className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full">
                                    <span className="text-xs font-bold text-purple-300">
                                        +{item.xp_reward} XP
                                    </span>
                                </div>
                            )}

                            <button className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-white/50" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};