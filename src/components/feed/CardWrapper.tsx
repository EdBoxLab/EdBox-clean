import React, { useState, useRef } from 'react';
import type { FeedItem, Feedback } from '@/types/feed';
import { ThumbsUpIcon, ThumbsDownIcon, BookmarkIcon, ShareIcon } from './MediaIcons';
import { useSounds } from './useSounds';
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface CardWrapperProps {
    item: FeedItem;
    isActive: boolean;
    onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
    children: React.ReactNode;
    onFeedback: (id: string, feedback: Feedback) => void;
}

const cardBaseClass = 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600';

export const CardWrapper: React.FC<CardWrapperProps> = ({ item, isActive, onSwipe, children, onFeedback }) => {
    const [translateX, setTranslateX] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeFeedback, setSwipeFeedback] = useState<'got_it' | 'skip' | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const startX = useRef(0);
    const startY = useRef(0);
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

    const handleSwipeStart = (clientX: number, clientY: number) => {
        // Check if user clicked on an interactive element
        const target = document.elementFromPoint(clientX, clientY) as HTMLElement;
        if (target) {
            const isInteractive = target.closest('button, input, textarea, a, [role="button"]');
            if (isInteractive) {
                return; // Don't start swipe on interactive elements
            }
        }
        
        setIsSwiping(true);
        startX.current = clientX;
        startY.current = clientY;
    };

    const handleSwipeMove = (clientX: number, clientY: number) => {
        if (!isSwiping) return;
        
        const diffX = clientX - startX.current;
        const diffY = Math.abs(clientY - startY.current);
        
        // Only track horizontal swipes (not vertical scrolls)
        if (diffY > 30) {
            setIsSwiping(false);
            setTranslateX(0);
            return;
        }
        
        setTranslateX(diffX);
    };

    const handleSwipeEnd = () => {
        if (!isSwiping || swipeFeedback) return;

        if (translateX > 100) {
            playSwipe();
            setSwipeFeedback('got_it');
            setTimeout(() => {
                setIsSwiping(false);
                setTranslateX(500);
                setOpacity(0);
                setTimeout(() => onSwipe(item.id, 'got_it', item.xp_reward), 300);
            }, 500);
        } else if (translateX < -100) {
            playSwipe();
            setSwipeFeedback('skip');
            setTimeout(() => {
                setIsSwiping(false);
                setTranslateX(-500);
                setOpacity(0);
                setTimeout(() => onSwipe(item.id, 'skip'), 300);
            }, 500);
        } else {
            setIsSwiping(false);
            setTranslateX(0);
            setOpacity(1);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, a, [role="button"]')) {
            return; // Don't interfere with interactive elements
        }
        handleSwipeStart(e.clientX, e.clientY);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => handleSwipeMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleSwipeEnd();
    const handleMouseLeave = () => handleSwipeEnd();

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
        if (target?.closest('button, input, textarea, a, [role="button"]')) {
            return; // Don't interfere with interactive elements
        }
        handleSwipeStart(touch.clientX, touch.clientY);
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleSwipeMove(touch.clientX, touch.clientY);
    };
    
    const handleTouchEnd = () => handleSwipeEnd();

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
            className={`relative h-full w-full flex flex-col justify-between p-6 text-white ${cardBaseClass} overflow-hidden rounded-xl transition-all duration-300 ${isActive ? 'border-zinc-600 shadow-lg' : ''}`}
            style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                opacity: opacity,
                transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out, border-color 0.3s ease-out',
            }}
            onMouseDown={swipeFeedback ? undefined : handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={swipeFeedback ? undefined : handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {swipeFeedback && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none">
                    <div className={`
                    text-xl sm:text-2xl md:text-3xl font-bold border-4 rounded-xl px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 transform shadow-lg
                    ${swipeFeedback === 'got_it' ? 'text-green-300 border-green-300 -rotate-12' : ''}
                    ${swipeFeedback === 'skip' ? 'text-red-400 border-red-400 rotate-12' : ''}
                `}>
                        {swipeFeedback === 'got_it' ? `GOT IT! +${item.xp_reward}` : 'SKIPPED'}
                    </div>
                </div>
            )}

            {/* Main Content Area - Interactive elements enabled */}
            <div className="flex-grow flex flex-col justify-center items-center z-10 w-full pointer-events-auto">
                {children}
            </div>

            {/* Bottom UI */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end gap-3 z-20 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                        <p className="font-bold text-base text-white">EdBox Feed</p>
                        <p className="text-sm text-gray-400">Personalized learning</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        aria-label="Save for later"
                        className={`p-2 rounded-lg transition-colors duration-200 cursor-pointer ${isSaved ? 'text-yellow-400 bg-zinc-800' : 'text-white hover:bg-zinc-700/50'}`}
                    >
                        <BookmarkIcon filled={isSaved} />
                    </button>
                    <button
                        onClick={handleShare}
                        aria-label="Share content"
                        className="p-2 rounded-lg transition-colors duration-200 text-white hover:bg-zinc-700/50 cursor-pointer"
                    >
                        <ShareIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onFeedback(item.id, 'like')}
                        disabled={!!item.feedback}
                        aria-label="Like this content"
                        className={`p-2 rounded-lg transition-colors duration-200 ${getFeedbackButtonClass('like')}`}
                    >
                        <ThumbsUpIcon filled={item.feedback === 'like'} className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onFeedback(item.id, 'dislike')}
                        disabled={!!item.feedback}
                        aria-label="Dislike this content"
                        className={`p-2 rounded-lg transition-colors duration-200 ${getFeedbackButtonClass('dislike')}`}
                    >
                        <ThumbsDownIcon filled={item.feedback === 'dislike'} className="h-5 w-5" />
                    </button>
                    <div className="bg-indigo-600 text-white font-bold px-3 py-1 text-sm rounded-lg whitespace-nowrap">
                        +{item.xp_reward} XP
                    </div>
                </div>
            </div>
        </div>
    );
};