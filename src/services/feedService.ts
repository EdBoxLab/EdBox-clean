import Groq from 'groq-sdk';
import { FeedItem, FeedItemType } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';

// Groq API Keys
const GROQ_KEYS = [
  process.env.NEXT_PUBLIC_GROQ_API_KEY_9,
  process.env.NEXT_PUBLIC_GROQ_API_KEY_20,
  process.env.NEXT_PUBLIC_GROQ_API_KEY_25,
].filter(Boolean) as string[];

const getRandomGroqKey = () => GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

// Helper functions (removed - not needed for Groq)

// Helper for retries with exponential backoff
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

  return retryOperation(async () => {
    try {
      const apiKey = getRandomGroqKey();
      if (!apiKey) {
        console.warn('No Groq API keys available for audio generation');
        return undefined;
      }

      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

      // Use Groq for text processing (Groq doesn't do TTS, so we'll return text-to-speech URL from a free service)
      // Or just return the text for client-side speech synthesis
      
      // For now, return undefined and use browser's Web Speech API instead
      console.log('Audio generation requested, using browser speech synthesis instead');
      return undefined;
      
      // Alternative: Use a TTS service like ElevenLabs, Play.ht, or browser's SpeechSynthesis API
    } catch (e) {
      console.error("Audio generation failed", e);
      return undefined;
    }
  });
};

// Database Persistence Helpers

export const persistFeedItems = async (items: FeedItem[], userId?: string) => {
  try {
    const key = userId ? `feed_items_${userId}` : 'feed_items_anonymous';
    const rows = items.map(item => ({
      type: item.type,
      content: (item as any).content ?? item,
      generated_at: new Date().toISOString()
    }));

    // Use localStorage for persistence (client-only)
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
    // Log to console for now - no database table needed
    console.log('📊 Interaction tracked:', { userId, itemId, type, timestamp: new Date().toISOString() });
    
    // Store in localStorage as fallback tracking
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `interactions_${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        itemId,
        type,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 interactions
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

