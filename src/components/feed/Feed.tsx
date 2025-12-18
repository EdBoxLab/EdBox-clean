'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { FeedItem, InsightFeedItem, StoryFeedItem, QuizFeedItem, ChallengeFeedItem, FactFeedItem, Feedback, UserPreferences, AudioGenerationState } from '@/types/feed';
import { generateFeedBatch, persistFeedItems, trackInteraction } from '@/services/feedService';
import { CardWrapper } from './CardWrapper';
import { QuizCard } from './QuizCard';
import { VideoCard } from './VideoCard';
import { InsightCard } from './InsightCard';
import { ChallengeCard } from './ChallengeCard';
import { FactCard } from './FactCard';
import { StoryCard } from './StoryCard';
import { SkeletonCard } from './SkeletonCard';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';

interface FeedProps {
  preferences: UserPreferences;
}

const FeedAnimations = () => (
  <style>{`
    @keyframes fadeInUpBounce {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }
      70% {
        opacity: 1;
        transform: translateY(-5px) scale(1.01);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-card-enter {
      animation: fadeInUpBounce 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards;
    }
    .active-card-indicator {
      box-shadow: 0 0 25px 5px rgba(168, 85, 247, 0.4);
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

  // Audio State for Articles
  const [summaryAudio, setSummaryAudio] = useState<Record<string, { state: AudioGenerationState, buffer?: AudioBuffer }>>({});

  // No Article Reading State needed anymore

  const feedRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingRef = useRef(false);
  const lastLoadRef = useRef<number>(0);
  const supabase = createSupabaseBrowserClient();

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const loadMoreItems = useCallback(async (initial = false) => {
    // Prevent rapid repeated calls
    const now = Date.now();
    if (now - lastLoadRef.current < 5000) {
      console.log('⏳ Throttling feed load - too soon since last load');
      return;
    }

    if (processingRef.current) {
      console.log('⏳ Already processing feed request - skipping');
      return;
    }

    console.log('📥 Starting feed load...', { initial, currentBatch });
    lastLoadRef.current = now;
    processingRef.current = true;

    if (initial) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: undefined } }));
      if (!user) {
        console.info('No user found; generating anonymous feed');
      }

      // For new batches, exclude previously viewed content types
      const allContentTypes = ['quiz', 'article', 'fact', 'challenge', 'story'];
      const shouldReset = viewedTypes.size >= allContentTypes.length;
      const excludeTypes = initial || shouldReset ? [] : Array.from(viewedTypes);

      if (shouldReset) {
        console.log('🔄 Resetting content types - all types viewed');
        setViewedTypes(new Set());
      }

      const itemBatch = await generateFeedBatch(preferences.interests, likedTopics, excludeTypes);
      console.log('✅ Received', itemBatch.length, 'items from API');

      // Persist generated items
      await persistFeedItems(itemBatch, user?.id);

      // Process items
      const processedItems = itemBatch.filter(item => item.type !== 'meme');

      // Track content types in this batch
      const newTypes = new Set(processedItems.map(item => item.type));
      setViewedTypes(prev => shouldReset ? newTypes : new Set([...prev, ...newTypes]));

      const newItems = processedItems;

      if (initial) {
        setItems(newItems);
        setCurrentBatch(1);
        setHasLoadedInitial(true);
        if (newItems.length > 0) {
          setActiveCardId(newItems[0].id);
          setActiveIndex(0);
        }
        console.log('✅ Initial feed loaded:', newItems.length, 'items');
      } else {
        setItems(prev => [...prev, ...newItems]);
        setCurrentBatch(prev => prev + 1);
        console.log('✅ Loaded batch', currentBatch + 1, ':', newItems.length, 'new items');
      }
    } catch (err) {
      console.error("❌ Failed to load feed items", err);
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  }, [preferences.interests, likedTopics]); // Removed viewedTypes and currentBatch from dependencies

  // Initial Load - ONLY ONCE
  useEffect(() => {
    if (!hasLoadedInitial) {
      console.log('🚀 Initial feed load triggered');
      loadMoreItems(true);
    }
  }, [hasLoadedInitial]); // Only depend on hasLoadedInitial, NOT loadMoreItems

  // Infinite Scroll Observer
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

              // Load more when user reaches the last 2 items in current batch
              const itemsPerBatch = 7;
              const batchEndThreshold = (currentBatch * itemsPerBatch) - 2;

              if (index !== -1 && index >= batchEndThreshold && !loading && !processingRef.current) {
                console.log('📍 Near end of batch - loading more...', { index, threshold: batchEndThreshold });
                loadMoreItems();
              }
              return newActiveId;
            }
            return prevId;
          });
        }
      },
      {
        threshold: 0.6,
        root: feedRef.current
      }
    );

    const currentFeedRef = feedRef.current;
    if (currentFeedRef) {
      const cards = currentFeedRef.querySelectorAll('.feed-card');
      cards.forEach((card) => observer.current?.observe(card));
    }

    return () => observer.current?.disconnect();
  }, [items, loading, currentBatch, loadMoreItems]);

  const handleFeedback = async (id: string, feedback: Feedback) => {
    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, feedback } : item
    ));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ok = await trackInteraction(user.id, id, feedback);
      if (!ok) console.warn('trackInteraction failed for', id, feedback);
    }

    const item = items.find(i => i.id === id);
    if (item && feedback === 'like') {
      setLikedTopics(prev => [...prev, item.topic]);
    }
  };

  const handleSwipe = async (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ok = await trackInteraction(user.id, id, action);
      if (!ok) console.warn('trackInteraction failed for', id, action);

      if ((action === 'got_it' || action === 'answered') && xp) {
        try {
          const response = await fetch('/api/xp/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              xpGained: xp,
              activity: action === 'got_it' ? 'feed_complete' : 'feed_quiz_correct',
              skillGraphId: 'default'
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✨ +${xp} XP! Level ${result.xp.level} | ${result.streak} day streak`);

            if (result.xp.leveledUp) {
              console.log('🎉 LEVEL UP!');
            }
          }
        } catch (error) {
          console.error('Failed to update XP:', error);
        }
      }
    }

    // Scroll to next
    const currentIndex = items.findIndex(i => i.id === id);
    if (currentIndex !== -1 && currentIndex < items.length - 1) {
      const nextCard = document.getElementById(items[currentIndex + 1].id);
      nextCard?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCorrectAnswer = (xp: number, isStreak: boolean) => {
    console.log("Correct answer!", xp, isStreak);
  };

  const handleIncorrectAnswer = () => {
    console.log("Incorrect");
  };

  const renderCardContent = (item: FeedItem, isActive: boolean) => {
    switch (item.type) {
      case 'quiz':
        return <QuizCard item={item as QuizFeedItem} isActive={isActive} onCorrect={handleCorrectAnswer} onIncorrect={handleIncorrectAnswer} onSwipe={handleSwipe} />;
      case 'video':
        return <VideoCard item={item as any} isActive={isActive} />;
      case 'insight':
      case 'article':
        return (
          <InsightCard
            item={item as InsightFeedItem}
            isActive={isActive}
          />
        );
      case 'challenge':
        return <ChallengeCard item={item as ChallengeFeedItem} isActive={isActive} onCorrect={handleCorrectAnswer} onIncorrect={handleIncorrectAnswer} onSwipe={handleSwipe} />;
      case 'fact':
        return <FactCard item={item as FactFeedItem} isActive={isActive} />;
      case 'story':
        return <StoryCard item={item as StoryFeedItem} isActive={isActive} onSwipe={handleSwipe} />;
      default:
        return null;
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <h2 className="text-xl font-light text-gray-400">Curating your feed...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <FeedAnimations />

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <XPStreakDisplay showCompact={true} />
      </div>

      <div className="max-w-md mx-auto h-screen snap-y snap-mandatory overflow-y-auto scroll-smooth no-scrollbar pt-10 px-4" ref={feedRef}>
        {items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className="feed-card opacity-0 animate-card-enter min-h-screen flex items-stretch snap-start"
            style={{ animationDelay: `${(index % 5) * 100}ms` }}
          >
            <CardWrapper
              item={item}
              isActive={activeCardId === item.id}
              onSwipe={handleSwipe}
              onFeedback={handleFeedback}
            >
              <div className="w-full h-full flex flex-col justify-center">
                {renderCardContent(item, activeCardId === item.id)}
              </div>
            </CardWrapper>
          </div>
        ))}

        {(loading || items.length === 0) && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {loading && items.length > 0 && (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading fresh content...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;