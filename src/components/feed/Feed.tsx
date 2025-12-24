'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { FeedItem, InsightFeedItem, StoryFeedItem, QuizFeedItem, FactFeedItem, PollFeedItem, Feedback, UserPreferences, AudioGenerationState } from '@/types/feed';
import { generateFeedBatch, persistFeedItems, trackInteraction } from '@/services/feedService';
import { CardWrapper } from './CardWrapper';
import { QuizCard } from './QuizCard';
import { VideoCard } from './VideoCard';
import { InsightCard } from './InsightCard';
import { FactCard } from './FactCard';
import { StoryCard } from './StoryCard';
import { PollCard } from './PollCard';
import { MemeCard } from './MemeCard';
import { SkeletonCard } from './SkeletonCard';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedProps {
  preferences: UserPreferences;
}

const FeedAnimations = () => (
  <style>{`
    @keyframes fadeInUpBounce {
      0% {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      70% {
        opacity: 1;
        transform: translateY(-5px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-card-enter {
      animation: fadeInUpBounce 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

const Feed: React.FC<FeedProps> = ({ preferences }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [likedTopics, setLikedTopics] = useState<string[]>([]);
  const [viewedTypes, setViewedTypes] = useState<Set<string>>(new Set());
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const processingRef = useRef(false);
  const lastLoadRef = useRef<number>(0);
  const supabase = createSupabaseBrowserClient();

  const loadMoreItems = useCallback(async (initial = false) => {
    const now = Date.now();
    if (now - lastLoadRef.current < 5000) return;
    if (processingRef.current) return;

    lastLoadRef.current = now;
    processingRef.current = true;
    if (initial) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: undefined } }));
      
      const allContentTypes = ['quiz', 'article', 'fact', 'poll', 'story', 'meme'];
      const shouldReset = viewedTypes.size >= allContentTypes.length;
      const excludeTypes = initial || shouldReset ? [] : Array.from(viewedTypes);

      if (shouldReset) setViewedTypes(new Set());

      const itemBatch = await generateFeedBatch(preferences.interests, likedTopics, excludeTypes);
      await persistFeedItems(itemBatch, user?.id);

      const newTypes = new Set(itemBatch.map(item => item.type));
      setViewedTypes(prev => shouldReset ? newTypes : new Set([...prev, ...newTypes]));

      if (initial) {
        setItems(itemBatch);
        setCurrentBatch(1);
        setHasLoadedInitial(true);
        if (itemBatch.length > 0) {
          setActiveCardId(itemBatch[0].id);
          setActiveIndex(0);
        }
      } else {
        const existingIds = new Set(items.map(i => i.id));
        const uniqueNewItems = itemBatch.filter(i => !existingIds.has(i.id));

        if (uniqueNewItems.length > 0) {
          setItems(prev => [...prev, ...uniqueNewItems]);
          setCurrentBatch(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("❌ Failed to load feed items", err);
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  }, [preferences.interests, likedTopics, viewedTypes, currentBatch, supabase]);

  useEffect(() => {
    if (!hasLoadedInitial) loadMoreItems(true);
  }, [hasLoadedInitial, loadMoreItems]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting && entry.intersectionRatio > 0.5);
        if (intersectingEntry) {
          const newActiveId = intersectingEntry.target.id;
          setActiveCardId(prevId => {
            if (prevId !== newActiveId) {
              const index = items.findIndex(item => item.id === newActiveId);
              setActiveIndex(index);
              const loadThreshold = items.length - 3;
              if (index !== -1 && index >= loadThreshold && !loading && !processingRef.current) {
                loadMoreItems();
              }
              return newActiveId;
            }
            return prevId;
          });
        }
      },
      { threshold: 0.6, root: feedRef.current }
    );

    const currentFeedRef = feedRef.current;
    if (currentFeedRef) {
      const cards = currentFeedRef.querySelectorAll('.feed-card');
      cards.forEach((card) => observer.current?.observe(card));
    }

    return () => observer.current?.disconnect();
  }, [items, loading, currentBatch, loadMoreItems]);

  const handleFeedback = async (id: string, feedback: Feedback) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newFeedback = item.feedback === feedback ? null : feedback;
    setItems(prev => prev.map(i => i.id === id ? { ...i, feedback: newFeedback } : i));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await trackInteraction(user.id, id, newFeedback as Feedback);
    if (newFeedback === 'like') setLikedTopics(prev => [...prev, item.topic]);
  };

  const handleSwipe = async (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await trackInteraction(user.id, id, action);
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

    const currentIndex = items.findIndex(i => i.id === id);
    if (currentIndex !== -1 && currentIndex < items.length - 1) {
      const nextCard = document.getElementById(items[currentIndex + 1].id);
      nextCard?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderCardContent = (item: FeedItem, isActive: boolean) => {
    switch (item.type) {
      case 'quiz':
        return <QuizCard item={item as QuizFeedItem} isActive={isActive} onCorrect={() => {}} onIncorrect={() => {}} onSwipe={handleSwipe} />;
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
      default:
        return null;
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 flex flex-col items-center"
        >
            <div className="relative mb-8">
                <Loader2 className="w-16 h-16 animate-spin text-purple-500" />
                <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Curating Your Mind</h2>
            <div className="flex items-center gap-2 text-white/30 text-xs font-black uppercase tracking-[0.3em]">
                <Sparkles className="w-3 h-3" />
                <span>Syncing with Genie</span>
                <Sparkles className="w-3 h-3" />
            </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <FeedAnimations />

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
        <XPStreakDisplay showCompact={true} />
      </div>

      <div className="w-full h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar" ref={feedRef}>
        {items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className="feed-card opacity-0 animate-card-enter h-screen w-full snap-start snap-always flex items-center justify-center px-4 py-16 sm:py-20"
            style={{ animationDelay: `${(index % 5) * 150}ms` }}
          >
            <div className="w-full max-w-2xl h-full flex items-center justify-center">
              <CardWrapper
                item={item}
                isActive={activeCardId === item.id}
                onSwipe={handleSwipe}
                onFeedback={handleFeedback}
              >
                {renderCardContent(item, activeCardId === item.id)}
              </CardWrapper>
            </div>
          </div>
        ))}

        {loading && (
          <div className="h-screen snap-start flex items-center justify-center px-4">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500/50" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Fetching Wisdom</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
