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
  likedTopics: string[] = []
): Promise<(FeedItem)[]> => {
  return retryOperation(async () => {
    const response = await fetch('/api/feed/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, likedTopics }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  });
};

export const generateLessonImage = async (prompt: string): Promise<string> => {
  return retryOperation(async () => {
    try {
      const model = "gemini-2.5-flash-image";
      const refinedPrompt = `Cinematic, deep blue and teal lighting, 4k, abstract, minimalism, ${prompt}, dark moody atmosphere. No text.`;

      const response = await ai.models.generateContent({
        model,
        contents: refinedPrompt
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }

      return `https://picsum.photos/1080/1920?blur=5&random=${Math.random()}`;
    } catch (e) {
      console.error("Image gen failed", e);
      // Fallback instead of throwing for images
      return `https://picsum.photos/1080/1920?blur=5&random=${Math.random()}`;
    }
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

export const persistFeedItems = async (items: FeedItem[], userId: string) => {
  const rows = items.map(item => ({
    user_id: userId,
    type: item.type,
    content: item,
    generated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('feed_items').insert(rows);
  if (error) console.error('Failed to persist feed items:', error);
};

export const trackInteraction = async (userId: string, itemId: string, type: 'like' | 'dislike' | 'save' | 'skip' | 'got_it' | 'answered') => {
  const { error } = await supabase.from('user_feed_interactions').insert({
    user_id: userId,
    feed_item_id: itemId,
    interaction_type: type
  });
  if (error) console.error('Failed to track interaction:', error);
};