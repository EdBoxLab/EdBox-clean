'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { FeedItem, ArticleFeedItem, StoryFeedItem, QuizFeedItem, ChallengeFeedItem, FactFeedItem, Feedback, UserPreferences, AudioGenerationState } from '@/types/feed';
import { generateFeedBatch, generateLessonImage, persistFeedItems, trackInteraction } from '@/services/feedService';
import { CardWrapper } from './CardWrapper';
import { QuizCard } from './QuizCard';
import { ArticleCard } from './ArticleCard';
import { ChallengeCard } from './ChallengeCard';
import { FactCard } from './FactCard';
import { StoryCard } from './StoryCard';
import { SkeletonCard } from './SkeletonCard';
import { GenieResponseView } from './GenieResponseView';
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

  // Genie State
  const [isGenieActive, setIsGenieActive] = useState(false);
  const [genieExplanation, setGenieExplanation] = useState('');
  const [isGenieThinking, setIsGenieThinking] = useState(false);
  const [showGenieModal, setShowGenieModal] = useState(false);
  const [currentGenieItem, setCurrentGenieItem] = useState<FeedItem | null>(null);

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

      // Process media (Images)
      const processedItemsPromises = itemBatch.map(async (item) => {
        let processedItem = { ...item };

        // Skip meme items entirely
        if (item.type === 'meme') {
          return null;
        }

        // Generate images for types that need it
        if ('visualPrompt' in item && item.visualPrompt && !('imageUrl' in item && item.imageUrl)) {
          const itemWithImage = processedItem as any;
          itemWithImage.imageGenerationState = 'generating';

          try {
            const url = await generateLessonImage(item.visualPrompt);
            itemWithImage.imageUrl = url;
            itemWithImage.imageGenerationState = 'ready';
          } catch (e) {
            console.error("Image gen error", e);
            itemWithImage.imageGenerationState = 'error';
          }
        }

        return processedItem;
      });

      const processedItems = await Promise.all(processedItemsPromises);
      const newItems = processedItems.filter((item): item is FeedItem => item !== null);

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

  const handleAskGenie = (item: FeedItem) => {
    setCurrentGenieItem(item);
    setShowGenieModal(true);
    setIsGenieThinking(true);
    setGenieExplanation('');

    setTimeout(async () => {
      const explanation = `Here is a deeper look at "${item.title}". \n\nThe core concept here is ${item.topic}. It is important because it connects to... [Genie AI explanation would go here]`;
      setGenieExplanation(explanation);
      setIsGenieThinking(false);
    }, 1500);
  };

  const handleGenerateSummaryAudio = (item: ArticleFeedItem) => {
    // Placeholder for audio generation
    console.log("Generate audio for:", item.id);
  };

  const renderCardContent = (item: FeedItem) => {
    switch (item.type) {
      case 'quiz':
        return <QuizCard item={item as QuizFeedItem} onCorrect={handleCorrectAnswer} onIncorrect={handleIncorrectAnswer} onSwipe={handleSwipe} />;
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h2 className="text-xl font-light tracking-widest uppercase text-gray-400">Curating your feed...</h2>
      </div>
    );
  }

  return (
    <>
      <FeedAnimations />

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <XPStreakDisplay showCompact={true} />
      </div>

      <div
        ref={feedRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth bg-gray-950 no-scrollbar"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className="feed-card h-full w-full snap-start flex-shrink-0 opacity-0 animate-card-enter p-1 sm:p-2"
            style={{ animationDelay: `${(index % 5) * 100}ms` }}
          >
            <CardWrapper
              item={item}
              isActive={activeCardId === item.id}
              onSwipe={handleSwipe}
              onFeedback={handleFeedback}
              onAskGenie={handleAskGenie}
              isGenieActive={isGenieActive}
            >
              {renderCardContent(item)}
            </CardWrapper>
          </div>
        ))}

        {(loading || items.length === 0) && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>

      {showGenieModal && currentGenieItem && (
        <GenieResponseView
          item={currentGenieItem}
          explanation={genieExplanation}
          isLoading={isGenieThinking}
          onClose={() => setShowGenieModal(false)}
        />
      )}

      {readingArticle && (
        <div className="fixed inset-0 z-50">
          <ArticleView
            item={readingArticle}
            onClose={() => setReadingArticle(null)}
            onApiKeyError={() => alert("API Key Error: Please check your configuration.")}
          />
        </div>
      )}
    </>
  );
};

export default Feed;