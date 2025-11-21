
import React, { useState, useRef, useEffect } from 'react';
import type { FeedItem, ArticleFeedItem, /*VideoFeedItem,*/ FactFeedItem, Feedback, AudioGenerationState, StoryFeedItem } from '../types';
import { CardWrapper } from './CardWrapper';
// import { VideoCard } from '../VideoCard';
import { QuizCard } from '../QuizCard';
import { ArticleCard } from '../ArticleCard';
import { ChallengeCard } from '../ChallengeCard';
import { FactCard } from '../FactCard';
import { SkeletonCard } from './SkeletonCard';
import { CardImage } from '../CardImage';
import { ChevronLeftIcon, ChevronRightIcon, FinishIcon } from '../MediaIcons';

interface FeedProps {
  items: FeedItem[];
  onCorrectAnswer: (xp: number, isStreak: boolean) => void;
  onIncorrectAnswer: () => void;
  onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
  onViewArticle: (item: ArticleFeedItem) => void;
  isFetchingMore: boolean;
  onFeedback: (id: string, feedback: Feedback) => void;
  onAskGenie: (item: FeedItem) => void;
  isGenieActive: boolean;
  summaryAudio: Record<string, { state: AudioGenerationState, buffer?: AudioBuffer }>;
  onGenerateSummaryAudio: (item: ArticleFeedItem) => void;
  onAlmostEnd: () => void;
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
            box-shadow: 0 0 25px 5px rgba(168, 85, 247, 0.4); /* purple glow */
        }
    `}</style>
);


// NEW COMPONENT: StoryCard
interface StoryCardProps {
  item: StoryFeedItem;
  onSwipe: (id: string, action: 'got_it' | 'answered', xp?: number) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ item, onSwipe }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = item.slides.length;
  const isLastSlide = currentSlide === totalSlides - 1;

  const handleNext = () => {
    if (isLastSlide) {
        onSwipe(item.id, 'got_it', item.xp_reward);
    } else {
        setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  const slide = item.slides[currentSlide];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative text-white px-2 sm:px-4">
      {/* Progress Bar */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
        {item.slides.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded-full"
            style={{
              backgroundColor: index <= currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)',
              transition: 'background-color 0.3s ease-in-out',
            }}
          />
        ))}
      </div>

      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 z-20 px-2 sm:px-4 text-center drop-shadow-lg">{item.title}</h2>

      {/* Image Container with Navigation */}
      <div className="relative w-full max-w-[90%] sm:max-w-[320px] aspect-[9/16] bg-gray-900 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center group">
        <CardImage
          generationState={slide.imageGenerationState}
          imageUrl={slide.image_url}
          altText={`Slide ${currentSlide + 1} for ${item.title}`}
        />
        
        {/* Navigation Overlays */}
        {currentSlide > 0 &&
            <div 
              className="absolute left-0 top-0 h-full w-1/2 z-10"
              onClick={handlePrev}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              role="button"
              aria-label="Previous slide"
            />
        }
        <div 
          className="absolute right-0 top-0 h-full w-1/2 z-10"
          onClick={handleNext}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          role="button"
          aria-label={isLastSlide ? "Finish story" : "Next slide"}
        />

        {/* Navigation Icons (visible on hover/active) */}
        {currentSlide > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ChevronLeftIcon />
          </div>
        )}
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {isLastSlide ? <FinishIcon /> : <ChevronRightIcon />}
        </div>
      </div>
      
       <p className="mt-3 sm:mt-4 text-gray-300 text-xs sm:text-sm h-5 z-20">
        {isLastSlide ? 'Tap right to finish!' : `${currentSlide + 1} / ${totalSlides}`}
       </p>
    </div>
  );
};


export const Feed: React.FC<FeedProps> = ({ items, onCorrectAnswer, onIncorrectAnswer, onSwipe, onViewArticle, isFetchingMore, onFeedback, onAskGenie, isGenieActive, summaryAudio, onGenerateSummaryAudio, onAlmostEnd }) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(items.length > 0 ? items[0].id : null);
  const observer = useRef<IntersectionObserver | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        // Find the first visible entry.
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
          const newActiveId = intersectingEntry.target.id;
          // Update state and check if we need more content, but only when the active card actually changes.
          setActiveCardId(prevId => {
              if (prevId !== newActiveId) {
                  const activeIndex = items.findIndex(item => item.id === newActiveId);
                  // Trigger fetch when user is 3 cards away from the end.
                  if (activeIndex !== -1 && activeIndex >= items.length - 3) {
                      onAlmostEnd();
                  }
                  return newActiveId;
              }
              return prevId;
          });
        }
      },
      { threshold: 0.7 } // 70% of the card must be visible
    );

    const currentFeedRef = feedRef.current;
    if (currentFeedRef) {
      const cards = currentFeedRef.querySelectorAll('.feed-card');
      cards.forEach((card) => observer.current?.observe(card));
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [items, onAlmostEnd]);

  const renderCardContent = (item: FeedItem) => {
    const isActive = activeCardId === item.id;
    switch (item.type) {
    //   case 'video':
    //     return <VideoCard item={item as VideoFeedItem} isActive={isActive} onSwipe={onSwipe} />;
      case 'quiz':
        return <QuizCard item={item} onCorrect={onCorrectAnswer} onIncorrect={onIncorrectAnswer} onSwipe={onSwipe} />;
      case 'article':
        return (
          <ArticleCard
            item={item as ArticleFeedItem}
            onViewArticle={onViewArticle}
            audioState={summaryAudio[item.id]}
            onGenerateAudio={() => onGenerateSummaryAudio(item as ArticleFeedItem)}
          />
        );
      case 'challenge':
        return <ChallengeCard item={item} onCorrect={onCorrectAnswer} onIncorrect={onIncorrectAnswer} onSwipe={onSwipe} />;
      case 'fact':
        return <FactCard item={item as FactFeedItem} />;
      case 'story':
        return <StoryCard item={item as StoryFeedItem} onSwipe={onSwipe} />;
      default:
        return null;
    }
  };

  return (
    <>
    <FeedAnimations />
    <div ref={feedRef} className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
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
            onSwipe={onSwipe}
            onFeedback={onFeedback}
            onAskGenie={onAskGenie}
            isGenieActive={isGenieActive}
          >
            {renderCardContent(item)}
          </CardWrapper>
        </div>
      ))}
      {/* Show skeletons if we are fetching more, or if the feed is empty (implying we're about to fetch) */}
      {(isFetchingMore || items.length === 0) && (
        <>
            <SkeletonCard />
            <SkeletonCard />
        </>
      )}
    </div>
    </>
  );
};
