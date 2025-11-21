'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Feed } from '../../fyp/hooks/Feed';
import { Header } from '../../fyp/hooks/Header';
// import type { UserStats, FeedItem, ArticleFeedItem, VideoFeedItem, QuizFeedItem, ChallengeFeedItem, FactFeedItem, Feedback, AudioGenerationState, StoryFeedItem, ImageGenerationState } from '../../fyp/types';
import type { UserStats, FeedItem, ArticleFeedItem, QuizFeedItem, ChallengeFeedItem, FactFeedItem, Feedback, AudioGenerationState, StoryFeedItem, ImageGenerationState } from '../../fyp/types';
import { ArticleView } from '../../fyp/hooks/ArticleView';
import { InterestSelector } from '../../fyp/hooks/InterestSelector';
import { GenieResponseView } from '../../fyp/hooks/GenieResponseView';

const welcomeCard: ArticleFeedItem = {
  id: 'welcome-card',
  type: 'article',
  xp_reward: 10,
  genie_reaction: 'wink',
  theme: 'purple-gradient',
  title: 'Welcome to your EdBox FYP!',
  summary: 'Your personalized learning journey starts now. Swipe up to explore, swipe left to skip, and ask Genie for help anytime!',
  full_article_content: `Welcome to EdBox! Here's a quick guide to get you started:

- **Explore Your Feed:** Just like your favorite social apps, swipe up to move to the next card. Each card is a bite-sized piece of knowledge tailored to your interests.

- **Interact & Earn:**
  - **Swipe Right (or tap 'Got it!'):** If you understand a concept, swipe it right to earn XP and EdCoins.
  - **Swipe Left:** Not interested? Swipe left to skip. This helps us learn what you don't like.
  - **Quizzes & Challenges:** Answer correctly to build up your daily streak for bonus XP!

- **Go Deeper:**
  - On article cards, tap 'Read More' to dive into the full content, with interactive terms and mini-quizzes.
  - You can also listen to article summaries and save them for later.

- **Ask Genie:**
  - See the purple magic icon? Tap it anytime you're curious! Genie can explain concepts, provide more details, or give you hints.

Your feed will adapt to your interactions. The more you learn, the smarter it gets. Happy learning!`,
  imageGenerationState: 'ready',
  feedback: null,
};

// Audio decoding helpers
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const FYPPage: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 1250,
    edCoins: 500,
    streak: 3,
  });
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [viewingArticle, setViewingArticle] = useState<ArticleFeedItem | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [hasSelectedInterests, setHasSelectedInterests] = useState(false);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [positiveInteractionTopics, setPositiveInteractionTopics] = useState<string[]>([]);
  const [negativeInteractionTopics, setNegativeInteractionTopics] = useState<string[]>([]);

  const [genieSelectedItem, setGenieSelectedItem] = useState<FeedItem | null>(null);
  const [genieExplanation, setGenieExplanation] = useState<string>('');
  const [isGenieLoading, setIsGenieLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [summaryAudio, setSummaryAudio] = useState<Record<string, { state: AudioGenerationState, buffer?: AudioBuffer }>>({});
  
  const backgroundLoopController = useRef<{ running: boolean, stop: boolean }>({ running: false, stop: false });

  const handleApiError = useCallback((error: any, context: string) => {
    console.error(`API Error during ${context}:`, error);
    
    setFetchError(`An error occurred during ${context}. Please try again later.`);
    setTimeout(() => setFetchError(null), 5000);

    setIsFetchingMore(false);
    setIsGenieLoading(false);

    if (backgroundLoopController.current) {
        backgroundLoopController.current.stop = true;
    }

    setFeedItems(prev =>
        prev.map(fi => {
            const item = { ...fi };
            /* if (item.type === 'video' && 'generationState' in item && item.generationState === 'generating') {
                item.generationState = 'error';
            } */
            if ('imageGenerationState' in item && item.imageGenerationState === 'generating') {
                item.imageGenerationState = 'error';
            }
            if (item.type === 'story') {
                const newSlides = item.slides.map(slide => {
                    if (slide.imageGenerationState === 'generating') {
                        return { ...slide, imageGenerationState: 'error' as const };
                    }
                    return slide;
                });
                item.slides = newSlides;
            }
            return item;
        })
    );
  }, []);

  const generateImage = async (prompt: string): Promise<string> => {
      const response = await fetch('/api/fyp/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Image generation failed');
      }
      const { image } = await response.json();
      return `data:image/png;base64,${image}`;
  };
/*
  const generatePlaceholderForItem = useCallback(async (item: VideoFeedItem): Promise<void> => {
    setFeedItems(prev =>
      prev.map(fi => (fi.id === item.id ? { ...fi, placeholderGenerationState: 'generating' as const } : fi))
    );

    try {
        const imageUrl = await generateImage(item.placeholder_image_prompt);
        setFeedItems(prev =>
            prev.map(fi =>
              fi.id === item.id
                ? { ...fi, placeholderGenerationState: 'ready' as const, placeholder_image_url: imageUrl }
                : fi
            )
          );
    } catch (error) {
      handleApiError(error, 'placeholder generation');
      setFeedItems(prev =>
        prev.map(fi => (fi.id === item.id ? { ...fi, placeholderGenerationState: 'error' as const } : fi))
      );
    }
  }, [handleApiError]);
*/
  const generateCardImageForItem = useCallback(async (item: QuizFeedItem | ArticleFeedItem | ChallengeFeedItem | FactFeedItem): Promise<void> => {
    if (!item.image_prompt) return;

    setFeedItems(prev =>
      prev.map(fi => (fi.id === item.id ? { ...fi, imageGenerationState: 'generating' as const } : fi))
    );

    try {
        const imageUrl = await generateImage(item.image_prompt);
        setFeedItems(prev =>
            prev.map(fi =>
              fi.id === item.id
                ? { ...fi, imageGenerationState: 'ready' as const, image_url: imageUrl }
                : fi
            )
          );
    } catch (error) {
       handleApiError(error, 'card image generation');
       setFeedItems(prev =>
        prev.map(fi => (fi.id === item.id ? { ...fi, imageGenerationState: 'error' as const } : fi))
      );
    }
  }, [handleApiError]);
  
  const generateStorySlideImage = useCallback(async (itemId: string, slideIndex: number, imagePrompt: string): Promise<void> => {
    setFeedItems(prev =>
      prev.map(fi => {
        if (fi.id === itemId && fi.type === 'story') {
          const newSlides = [...fi.slides];
          newSlides[slideIndex] = { ...newSlides[slideIndex], imageGenerationState: 'generating' as const };
          return { ...fi, slides: newSlides };
        }
        return fi;
      })
    );

    try {
        const imageUrl = await generateImage(imagePrompt);
        setFeedItems(prev =>
            prev.map(fi => {
              if (fi.id === itemId && fi.type === 'story') {
                const newSlides = [...fi.slides];
                newSlides[slideIndex] = {
                  ...newSlides[slideIndex],
                  imageGenerationState: 'ready' as const,
                  image_url: imageUrl,
                };
                return { ...fi, slides: newSlides };
              }
              return fi;
            })
          );
    } catch (error) {
      handleApiError(error, `story slide image generation`);
      setFeedItems(prev =>
        prev.map(fi => {
          if (fi.id === itemId && fi.type === 'story') {
            const newSlides = [...fi.slides];
            newSlides[slideIndex] = { ...newSlides[slideIndex], imageGenerationState: 'error' as const };
            return { ...fi, slides: newSlides };
          }
          return fi;
        })
      );
    }
  }, [handleApiError]);
/*
  useEffect(() => {
    const generatePendingPlaceholders = async () => {
      const pendingPlaceholders = feedItems.filter(
        (item): item is VideoFeedItem =>
          item.type === 'video' && item.placeholderGenerationState === 'pending'
      );

      for (const item of pendingPlaceholders) {
        await generatePlaceholderForItem(item);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };
    generatePendingPlaceholders();
  }, [feedItems, generatePlaceholderForItem]);
*/
  useEffect(() => {
    const generatePendingImages = async () => {
      const tasks: (
        | { type: 'card'; item: QuizFeedItem | ArticleFeedItem | ChallengeFeedItem | FactFeedItem }
        | { type: 'story_slide'; itemId: string; slideIndex: number; imagePrompt: string }
      )[] = [];

      feedItems.forEach(item => {
        if ('imageGenerationState' in item && item.imageGenerationState === 'pending') {
          tasks.push({ type: 'card', item: item as QuizFeedItem | ArticleFeedItem | ChallengeFeedItem | FactFeedItem });
        }
        if (item.type === 'story') {
          item.slides.forEach((slide, index) => {
            if (slide.imageGenerationState === 'pending') {
              tasks.push({
                type: 'story_slide',
                itemId: item.id,
                slideIndex: index,
                imagePrompt: slide.image_prompt,
              });
            }
          });
        }
      });
      
      for (const task of tasks) {
        if (task.type === 'card') {
          await generateCardImageForItem(task.item);
        } else if (task.type === 'story_slide') {
          await generateStorySlideImage(task.itemId, task.slideIndex, task.imagePrompt);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };
    generatePendingImages();
  }, [feedItems, generateCardImageForItem, generateStorySlideImage]);

  const processAndSetNewItems = useCallback((newItems: FeedItem[]) => {
    if (newItems.length === 0) return;

    setFeedItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const validNewItems = newItems
        .filter(item => item && item.id && !existingIds.has(item.id))
        .map(item => {
          let newItem: FeedItem = { ...item, feedback: null };
          /* if (newItem.type === 'video') {
            return { ...newItem, generationState: 'pending', placeholderGenerationState: 'pending' } as VideoFeedItem;
          } */
          if (newItem.type === 'story') {
              const storyItem = newItem as StoryFeedItem;
              const slidesWithPendingState = storyItem.slides.map(slide => ({
                  ...slide,
                  imageGenerationState: 'pending' as const
              }));
              return { ...storyItem, slides: slidesWithPendingState };
          }
          if ('image_prompt' in newItem && newItem.image_prompt) {
            return { ...newItem, imageGenerationState: 'pending' as ImageGenerationState };
          }
          return newItem;
        });

      if (validNewItems.length > 0) {
        return [...prev, ...validNewItems];
      }
      
      return prev;
    });
  }, []);

  const generateFeedItems = useCallback(async (
    count: number,
    interests: string[],
    positiveTopics: string[],
    negativeTopics: string[],
    existingIds: string = '',
    existingTitles: string = ''
  ): Promise<FeedItem[] | null> => {
      try {
          const response = await fetch('/api/fyp/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  count, interests, positiveTopics, negativeTopics,
                  existingIds, existingTitles
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate feed items');
          }

          const { feed_items } = await response.json();
          return feed_items as FeedItem[];
      } catch (error) {
          console.error(`Failed to generate ${count} feed items:`, error);
          throw error;
      }
}, []);

const fetchInitialContent = useCallback(async (interests: string[]) => {
    setFetchError(null);
    setIsFetchingMore(true);

    try {
        const newItems = await generateFeedItems(1, interests, [], [], '', '');

        if (!newItems || newItems.length === 0) {
          console.warn("Initial content generation failed, background fetcher will retry.");
          return;
        }
        
        processAndSetNewItems(newItems);
        
    } catch (error) {
        handleApiError(error, "initial content fetch");
    } finally {
        setIsFetchingMore(false);
    }
  }, [generateFeedItems, processAndSetNewItems, handleApiError]);

  const fetchMoreContent = useCallback(async () => {
    if (isFetchingMore) {
        return;
    }
    setIsFetchingMore(true);
    setFetchError(null);

    try {
        const existingIds = feedItems.map(item => item.id).join(', ');
        const existingTitles = feedItems.map(item => item.title).join('; ');
        
        const newItems = await generateFeedItems(
            3,
            userInterests,
            positiveInteractionTopics,
            negativeInteractionTopics,
            existingIds,
            existingTitles
        );

        if (newItems && newItems.length > 0) {
            processAndSetNewItems(newItems);
        }
    } catch (error) {
        handleApiError(error, "fetching more content");
    } finally {
        setIsFetchingMore(false);
    }
  }, [isFetchingMore, feedItems, userInterests, positiveInteractionTopics, negativeInteractionTopics, processAndSetNewItems, generateFeedItems, handleApiError]);

  const fetchMoreContentRef = useRef(fetchMoreContent);
  useEffect(() => {
    fetchMoreContentRef.current = fetchMoreContent;
  }, [fetchMoreContent]);

  useEffect(() => {
    const TARGET_BUFFER_SIZE = 8;
    const shouldRun = hasSelectedInterests;

    if (shouldRun && !backgroundLoopController.current.running) {
        backgroundLoopController.current = { running: true, stop: false };
        const loop = async () => {
            while (!backgroundLoopController.current.stop) {
                if (feedItems.length < TARGET_BUFFER_SIZE) {
                    await fetchMoreContentRef.current();
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            backgroundLoopController.current.running = false;
            backgroundLoopController.current.stop = false;
        };
        loop();
    } else if (!shouldRun && backgroundLoopController.current.running) {
        backgroundLoopController.current.stop = true;
    }

    return () => {
        if (backgroundLoopController.current.running) {
            backgroundLoopController.current.stop = true;
        }
    };
  }, [hasSelectedInterests, feedItems.length]);


  const handleGenerateSummaryAudio = async (item: ArticleFeedItem) => {
    if (summaryAudio[item.id]?.state === 'generating' || summaryAudio[item.id]?.state === 'ready') {
        return;
    }
    setSummaryAudio(prev => ({ ...prev, [item.id]: { state: 'generating' } }));
    
    try {
        const response = await fetch('/api/fyp/audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `A brief summary of the article titled: ${item.title}. ${item.summary}` }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Audio generation failed');
        }

        const { audio } = await response.json();
        
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decodedBytes = decode(audio);
        const audioBuffer = await decodeAudioData(decodedBytes, outputAudioContext, 24000, 1);
        outputAudioContext.close();
        
        setSummaryAudio(prev => ({ ...prev, [item.id]: { state: 'ready', buffer: audioBuffer } }));

    } catch (error) {
        handleApiError(error, "summary audio generation");
        setSummaryAudio(prev => ({ ...prev, [item.id]: { state: 'error' } }));
    }
  };

  const handleInterestsSelected = (interests: string[]) => {
    setUserInterests(interests);
    setHasSelectedInterests(true);
    setFeedItems([welcomeCard]);
    fetchInitialContent(interests);
  };

  const handleCorrectAnswer = useCallback((xp: number, isStreak: boolean) => {
    setUserStats(prev => ({
      ...prev,
      xp: prev.xp + xp + (isStreak ? prev.streak * 10 : 0),
      edCoins: prev.edCoins + Math.floor(xp / 10),
      streak: prev.streak + 1,
    }));
  }, []);

  const handleIncorrectAnswer = useCallback(() => {
    setUserStats(prev => ({
      ...prev,
      streak: 0,
    }));
  }, []);

  const handleSwipe = useCallback((id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => {
    const swipedItem = feedItems.find(item => item.id === id);
    if (!swipedItem) return;

    if (action === 'got_it' || action === 'answered') {
      setPositiveInteractionTopics(prev => [...prev, swipedItem.title]);
      if (action === 'got_it' && xp) {
        setUserStats(prev => ({
          ...prev,
          xp: prev.xp + xp,
          edCoins: prev.edCoins + Math.floor(xp / 10),
        }));
      }
    } else if (action === 'skip') {
      setNegativeInteractionTopics(prev => [...prev, swipedItem.title]);
      setUserStats(prev => ({
        ...prev,
        streak: 0,
      }));
    }
    
    setFeedItems(prev => prev.filter(item => item.id !== id));

  }, [feedItems]);

  const handleFeedback = useCallback((id: string, feedback: Feedback) => {
    const item = feedItems.find(i => i.id === id);
    if (!item) return;

    setFeedItems(prev => prev.map(fi =>
        fi.id === id ? { ...fi, feedback } : fi
    ));

    if (feedback === 'like') {
        setPositiveInteractionTopics(prev => [...prev, item.title]);
    } else {
        setNegativeInteractionTopics(prev => [...prev, item.title]);
    }
  }, [feedItems]);
  
  const handleViewArticle = (item: ArticleFeedItem) => {
    setViewingArticle(item);
  };

  const handleCloseArticle = () => {
    setViewingArticle(null);
  };

  const handleAskGenie = async (item: FeedItem) => {
    setGenieSelectedItem(item);
    setIsGenieLoading(true);
    setGenieExplanation('');

    try {
        const response = await fetch('/api/fyp/genie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Genie request failed');
        }

        const { explanation } = await response.json();
        setGenieExplanation(explanation);

    } catch (error) {
        handleApiError(error, "genie explanation");
    } finally {
        setIsGenieLoading(false);
    }
  };

  const handleCloseGenieExplanation = () => {
      setGenieSelectedItem(null);
  };
  
  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
    <div className="relative w-full h-full bg-gray-800 overflow-hidden">
      {!hasSelectedInterests ? (
        <InterestSelector onInterestsSelected={handleInterestsSelected} />
      ) : (
        <>
          <Header stats={userStats} />
          {fetchError && feedItems.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center p-8 text-center">
                  <div className="text-red-400 bg-red-900/30 p-6 rounded-lg">
                      <p className="font-bold text-lg">Oops! Something went wrong.</p>
                      <p className="mt-2">{fetchError}</p>
                  </div>
              </div>
          ) : (
            <Feed
              items={feedItems}
              onCorrectAnswer={handleCorrectAnswer}
              onIncorrectAnswer={handleIncorrectAnswer}
              onSwipe={handleSwipe}
              onViewArticle={handleViewArticle}
              isFetchingMore={isFetchingMore}
              onFeedback={handleFeedback}
              onAskGenie={handleAskGenie}
              isGenieActive={!!genieSelectedItem}
              summaryAudio={summaryAudio}
              onGenerateSummaryAudio={handleGenerateSummaryAudio}
              onAlmostEnd={fetchMoreContent}
            />
          )}
          {fetchError && feedItems.length > 0 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-xs bg-red-800/95 text-white text-center text-sm py-2 px-4 rounded-lg shadow-lg z-30 pointer-events-none">
                  {fetchError}
              </div>
          )}
{viewingArticle && <ArticleView item={viewingArticle} onClose={handleCloseArticle} onApiKeyError={() => handleApiError("API key is invalid or missing.", "article audio generation")} />}
{genieSelectedItem && (
            <GenieResponseView
              item={genieSelectedItem}
              explanation={genieExplanation}
              isLoading={isGenieLoading}
              onClose={handleCloseGenieExplanation}
            />
          )}
        </>
      )}
    </div>
  </div>
);
};

export default FYPPage;
