import React, { useState, useRef } from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ThumbsUpIcon, ThumbsDownIcon, BookmarkIcon, ShareIcon } from './MediaIcons';
import { useSounds } from './useSounds';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

const cardBaseClass = 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600';

export const CardWrapper: React.FC<CardWrapperProps> = ({ item, isActive, onSwipe, children, onFeedback }) => {
    const [isSaved, setIsSaved] = useState(false);
    const { playSwipe } = useSounds();
    const supabase = createSupabaseBrowserClient();

    const handleSave = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('saved_feed_items').insert([{
            user_id: user.id,
            feed_item_id: item.id,
            feed_item_type: item.type,
            content: item,
        }]);

        if (error) {
            console.error('Error saving item:', error);
        } else {
            setIsSaved(true);
        }
    };

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

    const handleAction = (action: 'got_it' | 'skip') => {
        playSwipe();
        if (action === 'got_it') {
            onSwipe(item.id, 'got_it', item.xp_reward);
        } else {
            onSwipe(item.id, 'skip');
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
            <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex flex-col gap-4 sm:gap-6 z-30 items-center">
                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button
                        onClick={() => onFeedback(item.id, 'like')}
                        disabled={!!item.feedback}
                        className={`p-2 sm:p-3 rounded-full bg-zinc-800/50 backdrop-blur-md border border-white/10 transition-all ${getFeedbackButtonClass('like')}`}
                    >
                        <ThumbsUpIcon filled={item.feedback === 'like'} className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">{item.likes || 0}</span>
                </div>

                <div className="flex flex-col items-center gap-1 pointer-events-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`p-2 sm:p-3 rounded-full bg-zinc-800/50 backdrop-blur-md border border-white/10 transition-all ${isSaved ? 'text-yellow-400' : 'text-white'}`}
                    >
                        <BookmarkIcon filled={isSaved} className="h-4 w-4 sm:h-6 sm:w-6" />
                    </button>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">Save</span>
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
            <div className="absolute bottom-4 sm:bottom-6 left-3 sm:left-4 right-12 sm:right-16 z-30 pointer-events-auto flex flex-col gap-3 sm:gap-4">
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

                <div className="flex items-center gap-2 sm:gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction('got_it')}
                        className="flex-grow py-2 sm:py-3 px-3 sm:px-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl border border-green-500/30 backdrop-blur-xl transition-all flex items-center justify-center gap-1 sm:gap-2 font-bold text-xs sm:text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden xs:inline">Got it</span>
                        <span className="xs:hidden">✓</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction('skip')}
                        className="py-2 sm:py-3 px-4 sm:px-6 bg-zinc-800/40 hover:bg-zinc-800/60 text-zinc-400 rounded-xl border border-white/5 backdrop-blur-xl transition-all flex items-center justify-center gap-1 sm:gap-2 font-bold text-xs sm:text-sm"
                    >
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden xs:inline">Skip</span>
                        <span className="xs:hidden">×</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
// End of CardWrapper