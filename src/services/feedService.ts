import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FeedItem, FeedItemType } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

// Note: We still keep generateLessonImage/Audio client side for now as requested by plan proxying generic feed first
// But feed generation is now fully secure.

export const generateFeedBatch = async (
  interests: string[],
  likedTopics: string[] = [],
  excludeTypes: string[] = []
): Promise<(FeedItem)[]> => {
  return retryOperation(async () => {
    const response = await fetch('/api/feed/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, likedTopics, excludeTypes }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  });
};


export const generateLessonAudio = async (text: string, audioContext: AudioContext): Promise<AudioBuffer | undefined> => {
  if (!text) return undefined;

  return retryOperation(async () => {
    try {
      const model = "gemini-2.5-flash-preview-tts";

      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          }
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) return undefined;

      const pcmData = decodeBase64(base64Audio);
      return pcmToAudioBuffer(pcmData, audioContext, 24000, 1);
    } catch (e) {
      console.error("TTS failed", e);
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
      // Server-side or no localStorage available: log a fallback
      console.warn('localStorage not available; skipping feed persistence');
    }
  } catch (err) {
    console.error('Failed to persist feed items to localStorage:', err);
  }
};

export const trackInteraction = async (userId: string, itemId: string, type: 'like' | 'dislike' | 'save' | 'skip' | 'got_it' | 'answered') : Promise<boolean> => {
  try {
    const result = await supabase.from('user_feed_interactions').insert({
      user_id: userId,
      feed_item_id: itemId,
      interaction_type: type
    });

    // Supabase may return an object with an `error` property or throw; be defensive
    if ((result as any).error) {
      console.error('Failed to track interaction:', (result as any).error, { userId, itemId, type });
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to track interaction (exception):', err, { userId, itemId, type });
    return false;
  }
};