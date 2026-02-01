'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardWrapper } from './CardWrapper';
import { QuizCard } from './QuizCard';
import { VideoCard } from './VideoCard';
import { InsightCard } from './InsightCard';
import { FactCard } from './FactCard';
import { StoryCard } from './StoryCard';
import { PollCard } from './PollCard';
import { MemeCard } from './MemeCard';
import { ChallengeCard } from './ChallengeCard';
import { DebateCard } from './DebateCard';
import { MediaCard } from './MediaCard';
import { AdCard } from './AdCard';
import { FeedItem, AdFeedItem, QuizFeedItem, PollFeedItem, MediaFeedItem, FactFeedItem, StoryFeedItem, InsightFeedItem } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';
import { trackInteraction } from '@/services/feedService';

interface FeedOverlayProps {
    items: FeedItem[];
    initialActiveId?: string;
    onClose: () => void;
    onLoadMore?: () => void;
    loading?: boolean;
    onItemUpdate?: (id: string, updates: Partial<FeedItem>) => void;
}

export const FeedOverlay: React.FC<FeedOverlayProps> = ({
    items,
    initialActiveId,
    onClose,
    onLoadMore,
    loading = false,
    onItemUpdate
}) => {
    const [activeCardId, setActiveCardId] = useState<string>(initialActiveId || (items[0]?.id));
    const [likedTopics, setLikedTopics] = useState<string[]>([]);
    const feedRef = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);

    // Scroll to initial item on mount
    useEffect(() => {
        if (initialActiveId) {
            const element = document.getElementById(`overlay-${initialActiveId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [initialActiveId]);

    // Intersection Observer for active card tracking and loading more
    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(
            (entries) => {
                const intersectingEntry = entries.find(entry => entry.isIntersecting && entry.intersectionRatio > 0.5);
                if (intersectingEntry) {
                    const newActiveId = intersectingEntry.target.getAttribute('data-id');
                    if (newActiveId) {
                        setActiveCardId(newActiveId);

                        // Check if we need to load more
                        const index = items.findIndex(item => item.id === newActiveId);
                        if (index >= items.length - 3 && onLoadMore && !loading) {
                            onLoadMore();
                        }
                    }
                }
            },
            { threshold: 0.5, root: feedRef.current }
        );

        const currentFeedRef = feedRef.current;
        if (currentFeedRef) {
            const cards = currentFeedRef.querySelectorAll('.overlay-card');
            cards.forEach((card) => observer.current?.observe(card));
        }

        return () => observer.current?.disconnect();
    }, [items, loading, onLoadMore]);

    const handleSwipe = async (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await trackInteraction(user.id, id, action);

            // Award XP logic if needed (reuse from Feed.tsx)
            if ((action === 'got_it' || action === 'answered') && xp) {
                try {
                    await fetch('/api/xp/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            xpGained: xp,
                            activity: action === 'got_it' ? 'feed_complete' : 'feed_quiz_correct',
                            skillGraphId: 'default'
                        })
                    });
                } catch (error) {
                    console.error('Failed to update XP:', error);
                }
            }
        }

        // Scroll to next
        const currentIndex = items.findIndex(i => i.id === id);
        if (currentIndex !== -1 && currentIndex < items.length - 1) {
            const nextId = items[currentIndex + 1].id;
            const nextCard = document.getElementById(`overlay-${nextId}`);
            nextCard?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleFeedback = async (id: string, feedback: any) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Optimistic UI Update
        if (onItemUpdate) {
            if (feedback === 'like') {
                const isCurrentlyLiked = item.feedback === 'like';
                onItemUpdate(id, {
                    feedback: isCurrentlyLiked ? undefined : 'like',
                    likes: isCurrentlyLiked ? Math.max(0, item.likes - 1) : item.likes + 1
                });
            } else if (feedback === 'save') {
                onItemUpdate(id, {
                    isSavedByUser: !item.isSavedByUser
                });
            }
        }

        // Async API Call
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await trackInteraction(user.id, id, feedback);
    };

    const renderCardContent = (item: FeedItem, isActive: boolean) => {
        // Reuse specific card rendering
        switch (item.type) {
            case 'quiz':
                return <QuizCard item={item as QuizFeedItem} isActive={isActive} onCorrect={() => { }} onIncorrect={() => { }} onSwipe={handleSwipe} />;
            case 'video':
                return <VideoCard item={item as any} isActive={isActive} />;
            case 'insight':
            case 'article':
                return <InsightCard item={item as InsightFeedItem} isActive={isActive} />;
            case 'poll':
                return <PollCard item={item as PollFeedItem} isActive={isActive} />;
            case 'fact':
                return <FactCard item={item as FactFeedItem} isActive={isActive} />;
            case 'story':
                return <StoryCard item={item as StoryFeedItem} isActive={isActive} onSwipe={handleSwipe} />;
            case 'meme':
                return <MemeCard item={item as any} />;
            case 'challenge':
                return <ChallengeCard item={item as any} isActive={isActive} />;
            case 'debate':
                return <DebateCard item={item as any} isActive={isActive} />;
            case 'media':
                return <MediaCard item={item as MediaFeedItem} isActive={isActive} onSwipe={handleSwipe} onFeedback={handleFeedback} />;
            case 'ad':
                return <AdCard
                    adClient={(item as AdFeedItem).adClient}
                    adSlot={(item as AdFeedItem).adSlot}
                    onSkip={() => handleSwipe(item.id, 'skip')}
                />;
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-zinc-800 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 cursor-pointer pointer-events-auto"
            >
                <X size={24} />
            </button>

            {/* Feed Scroll Container */}
            <div
                className="w-full h-full snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar"
                ref={feedRef}
            >
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        id={`overlay-${item.id}`}
                        data-id={item.id}
                        className="overlay-card h-screen w-full snap-start snap-always relative flex items-center justify-center p-4"
                    >
                        <CardWrapper
                            item={item}
                            isActive={activeCardId === item.id}
                            onSwipe={handleSwipe}
                            onFeedback={handleFeedback}
                        >
                            {renderCardContent(item, activeCardId === item.id)}
                        </CardWrapper>
                    </div>
                ))}

                {loading && (
                    <div className="h-screen w-full snap-start flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                )}
            </div>

            <style jsx global>{`
           .no-scrollbar::-webkit-scrollbar {
            display: none;
            }
            .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
            }
        `}</style>
        </motion.div>
    );
};
