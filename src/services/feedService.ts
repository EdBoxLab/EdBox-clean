import { FeedItem, FeedItemType } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';

async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;

    const isJsonError = error instanceof SyntaxError || error.message?.includes('JSON');
    const isNetworkError = error.message?.includes('429') || error.message?.includes('503') || error.message?.includes('fetch') || error.message?.includes('No text returned');

    if (isJsonError || isNetworkError) {
      console.warn(`Retrying operation... Attempts left: ${retries}. Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateFeedBatch = async (
  interests: string[],
  likedTopics: string[] = [],
  excludeTypes: string[] = [],
  seenIds: string[] = [],
  seenTitles: string[] = []
): Promise<(FeedItem)[]> => {
  return retryOperation(async () => {
    const response = await fetch('/api/feed/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, likedTopics, excludeTypes, seenIds, seenTitles }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  });
};

export const generateLessonAudio = async (text: string): Promise<string | undefined> => {
  if (!text) return undefined;
  console.log('Audio generation requested, using browser speech synthesis instead');
  return undefined;
};

export const persistFeedItems = async (items: FeedItem[], userId?: string) => {
  try {
    const key = userId ? `feed_items_${userId}` : 'feed_items_anonymous';
    const rows = items.map(item => ({
      type: item.type,
      content: (item as any).content ?? item,
      generated_at: new Date().toISOString()
    }));

    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...existing, ...rows]));
    } else {
      console.warn('localStorage not available; skipping feed persistence');
    }
  } catch (err) {
    console.error('Failed to persist feed items to localStorage:', err);
  }
};

export const trackInteraction = async (
  userId: string, 
  itemId: string, 
  type: 'like' | 'dislike' | 'save' | 'skip' | 'got_it' | 'answered'
): Promise<boolean> => {
  try {
    console.log('📊 Interaction tracked:', { userId, itemId, type, timestamp: new Date().toISOString() });
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `interactions_${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        itemId,
        type,
        timestamp: new Date().toISOString()
      });
      
      if (existing.length > 100) {
        existing.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    }
    
    return true;
  } catch (err) {
    console.error('Failed to track interaction:', err);
    return false;
  }
};
