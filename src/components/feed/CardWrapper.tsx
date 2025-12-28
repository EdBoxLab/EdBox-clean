import React from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ThumbsUpIcon, ShareIcon } from './MediaIcons';
import { ArrowRight, Share2, ThumbsUp, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardImage } from './CardImage';

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({ item, isActive, onSwipe, children, onFeedback }) => {
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
                console.error('Failed to copy info:', err);
            }
        }
    };

    const handleSave = async () => {
        // Optimistic UI update
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
            className={`relative h-full w-full flex flex-col justify-between text-white overflow-hidden rounded-3xl transition-all duration-700 ease-[0.23,1,0.32,1] ${
                isActive 
                    ? 'border-white/10 shadow-2xl bg-slate-950 ring-1 ring-white/5' 
                    : 'scale-[0.98] opacity-60'
            }`}
        >
            {/* Background Media - Contained within bounds */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <CardImage 
                    generationState={item.imageGenerationState || 'ready'} 
                    imageUrl={item.imageUrl} 
                    altText={item.title} 
                />
                {/* Stronger gradient overlay for text readability - Increased opacity on mobile */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95 z-10 sm:from-black/60 sm:via-black/20 sm:to-black/95" />
                {/* Subtle blur for better text contrast */}
                <div className="absolute inset-0 backdrop-blur-[2px] z-10" />
            </div>

            {/* Sidebar Interactions (Premium TikTok Style) - Only show if NOT media type */}
            {!isMediaType && (
                <div className="absolute right-4 sm:right-6 bottom-24 sm:bottom-32 flex flex-col gap-6 sm:gap-8 z-30 items-center pointer-events-none">
                    <motion.div 
                        initial={false}
                        animate={isActive ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center gap-2 pointer-events-auto"
                    >
                        <button
                            onClick={() => onFeedback(item.id, 'like')}
                            className={`group relative p-3.5 sm:p-4 rounded-full backdrop-blur-2xl border transition-all duration-500 ${
                                isLiked 
                                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            <ThumbsUp className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-500 ${isLiked ? 'scale-110' : 'group-hover:scale-110'}`} fill={isLiked ? "currentColor" : "none"} />
                            <AnimatePresence>
                                {isLiked && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        className="absolute inset-0 bg-purple-500 rounded-full"
                                    />
                                )}
                            </AnimatePresence>
                        </button>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Like</span>
                    </motion.div>

                    {/* Save Button */}
                    <motion.div 
                        initial={false}
                        animate={isActive ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
                        transition={{ delay: 0.55 }}
                        className="flex flex-col items-center gap-2 pointer-events-auto"
                    >
                        <button
                            onClick={handleSave}
                            className={`group relative p-3.5 sm:p-4 rounded-full backdrop-blur-2xl border transition-all duration-500 ${
                                isSaved 
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                            <Bookmark className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-500 ${isSaved ? 'scale-110' : 'group-hover:scale-110'}`} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Save</span>
                    </motion.div>

                    <motion.div 
                        initial={false}
                        animate={isActive ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col items-center gap-2 pointer-events-auto"
                    >
                        <button
                            onClick={handleShare}
                            className="group p-3.5 sm:p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-white/70 transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:text-white"
                        >
                            <Share2 className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform" />
                        </button>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Share</span>
                    </motion.div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col justify-center items-center z-20 w-full pointer-events-auto cursor-default px-4 sm:px-6">
                {children}
            </div>

            {/* Bottom Section: Metadata & Actions - Only show if NOT media type */}
            {!isMediaType && (
                <div className="absolute bottom-20 sm:bottom-12 left-6 sm:left-10 right-20 sm:right-24 z-30 pointer-events-none">
                    <motion.div 
                        initial={false}
                        animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                    >
                        {item.courseReference && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full w-fit backdrop-blur-md">
                                <ArrowRight className="w-3 h-3 text-purple-300" />
                                <span className="text-[9px] font-black text-purple-300 uppercase tracking-[0.15em]">Related to {item.courseReference}</span>
                            </div>
                        )}
                        <div className="space-y-1.5 p-5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:p-0">
                            <p className="font-black text-white text-base sm:text-lg tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">@{item.topic.toLowerCase().replace(/\s+/g, '')}</p>
                            <p className="text-sm sm:text-base text-white/95 font-semibold leading-relaxed line-clamp-2 max-w-[90%] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{item.title}</p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Global Gloss Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10" />
        </div>
    );
};
