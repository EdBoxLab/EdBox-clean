import React from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ThumbsUpIcon, ShareIcon } from './MediaIcons';
import { ArrowRight, Share2, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

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

    const isLiked = item.feedback === 'like';

    return (
        <div
            className={`relative h-full w-full flex flex-col justify-between p-4 sm:p-6 text-white overflow-hidden rounded-[2.5rem] transition-all duration-700 ease-[0.23,1,0.32,1] ${
                isActive 
                    ? 'border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] bg-[#050505] ring-1 ring-white/5' 
                    : 'scale-[0.92] grayscale-[0.5] opacity-40'
            }`}
        >
            {/* Sidebar Interactions (Premium TikTok Style) */}
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

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col justify-center items-center z-20 w-full pointer-events-auto cursor-default">
                {children}
            </div>

            {/* Bottom Section: Metadata & Actions */}
            <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-20 sm:right-24 z-30 pointer-events-none">
                <motion.div 
                    initial={false}
                    animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                >
                    {item.courseReference && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full w-fit">
                            <ArrowRight className="w-3 h-3 text-purple-400" />
                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.15em]">Related to {item.courseReference}</span>
                        </div>
                    )}
                    <div className="space-y-1">
                        <p className="font-black text-white text-base sm:text-lg tracking-tight">@{item.topic.toLowerCase().replace(/\s+/g, '')}</p>
                        <p className="text-sm sm:text-base text-white/60 font-medium leading-relaxed line-clamp-2 max-w-[90%]">{item.title}</p>
                    </div>
                </motion.div>
            </div>

            {/* Global Gloss Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        </div>
    );
};
