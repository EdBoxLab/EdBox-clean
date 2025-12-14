'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { FeedItem, ArticleFeedItem, StoryFeedItem, QuizFeedItem, ChallengeFeedItem, FactFeedItem, Feedback, UserPreferences, AudioGenerationState } from '@/types/feed';
import { generateFeedBatch, persistFeedItems, trackInteraction } from '@/services/feedService';
import { CardWrapper } from './CardWrapper';
import { QuizCard } from './QuizCard';
import { VideoCard } from './VideoCard';
import { ArticleCard } from './ArticleCard';
import { ChallengeCard } from './ChallengeCard';
import { FactCard } from './FactCard';
import { StoryCard } from './StoryCard';
import { SkeletonCard } from './SkeletonCard';
// Removed GenieResponseView import
import { ArticleView } from './ArticleView';
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

  // Removed genie functionality

  // Audio State for Articles
  const [summaryAudio, setSummaryAudio] = useState<Record<string, { state: AudioGenerationState, buffer?: AudioBuffer }>>({});

  // Article Reading State
  const [readingArticle, setReadingArticle] = useState<ArticleFeedItem | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingRef = useRef(false);
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
    if (processingRef.current) return;

    processingRef.current = true;
    if (initial) setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      const itemBatch = await generateFeedBatch(preferences.interests, likedTopics);

      // Persist generated items
      await persistFeedItems(itemBatch, user.id);

      // Process items (removed client-side image gen)
      const processedItems = itemBatch.filter(item => item.type !== 'meme');


      const newItems = processedItems;
      setItems(prev => [...prev, ...newItems]);
    } catch (err) {
      console.error("Failed to load feed items", err);
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  }, [preferences.interests, likedTopics, supabase]);

  // Initial Load
  useEffect(() => {
    loadMoreItems(true);
  }, [loadMoreItems]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
          const newActiveId = intersectingEntry.target.id;
          setActiveCardId(prevId => {
            if (prevId !== newActiveId) {
              const index = items.findIndex(item => item.id === newActiveId);
              setActiveIndex(index);

              // Load more when close to end
              if (index !== -1 && index >= items.length - 3 && !loading && !processingRef.current) {
                loadMoreItems();
              }
              return newActiveId;
            }
            return prevId;
          });
        }
      },
      { threshold: 0.6 }
    );

    const currentFeedRef = feedRef.current;
    if (currentFeedRef) {
      const cards = currentFeedRef.querySelectorAll('.feed-card');
      cards.forEach((card) => observer.current?.observe(card));
    }

    return () => observer.current?.disconnect();
  }, [items, loading, loadMoreItems]);

  const handleFeedback = async (id: string, feedback: Feedback) => {
    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, feedback } : item
    ));

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await trackInteraction(user.id, id, feedback);
    }

    const item = items.find(i => i.id === id);
    if (item && feedback === 'like') {
      setLikedTopics(prev => [...prev, item.topic]);
    }
  };

  const handleSwipe = async (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await trackInteraction(user.id, id, action);

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

  // Removed genie functionality

  const handleGenerateSummaryAudio = (item: ArticleFeedItem) => {
    // Placeholder for audio generation
    console.log("Generate audio for:", item.id);
  };

  const renderCardContent = (item: FeedItem) => {
    switch (item.type) {
      case 'quiz':
        return <QuizCard item={item as QuizFeedItem} onCorrect={handleCorrectAnswer} onIncorrect={handleIncorrectAnswer} onSwipe={handleSwipe} />;
      case 'video':
        return <VideoCard item={item as any} />;
      case 'article':

        return (
          <ArticleCard
            item={item as ArticleFeedItem}
            onViewArticle={(i) => setReadingArticle(i)}
            audioState={summaryAudio[item.id]}
            onGenerateAudio={() => handleGenerateSummaryAudio(item as ArticleFeedItem)}
          />
        );
      case 'challenge':
        return <ChallengeCard item={item as ChallengeFeedItem} onCorrect={handleCorrectAnswer} onIncorrect={handleIncorrectAnswer} onSwipe={handleSwipe} />;
      case 'fact':
        return <FactCard item={item as FactFeedItem} />;
      case 'story':
        return <StoryCard item={item as StoryFeedItem} onSwipe={handleSwipe} />;
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

      {/* Header matching homepage style */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pt-20">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Your Learning Feed
          </h1>
          <p className="text-lg text-gray-400">
            Personalized content to accelerate your learning journey.
          </p>
        </div>

        {/* Feed Grid - consistent with homepage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              id={item.id}
              className="feed-card opacity-0 animate-card-enter"
              style={{ animationDelay: `${(index % 5) * 100}ms` }}
            >
              <CardWrapper
                item={item}
                isActive={activeCardId === item.id}
                onSwipe={handleSwipe}
                onFeedback={handleFeedback}
              >
                <div className="min-h-[400px] flex flex-col justify-center">
                  {renderCardContent(item)}
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
        </div>
      </div>

      {readingArticle && (
        <div className="fixed inset-0 z-50">
          <ArticleView
            item={readingArticle}
            onClose={() => setReadingArticle(null)}
            onApiKeyError={() => alert("API Key Error: Please check your configuration.")}
          />
        </div>
      )}
    </div>
  );
};

export default Feed;