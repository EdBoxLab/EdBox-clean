import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson } from '@/types/feed';

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

export const generateLessonBatch = async (
  interests: string[],
  likedTopics: string[] = []
): Promise<Omit<Lesson, 'id' | 'imageUrl' | 'audioBuffer'>[]> => {
  const model = "gemini-2.5-flash";
  
  // Create a weighted pool where liked topics appear more frequently
  const pool = [...interests, ...likedTopics, ...likedTopics, ...likedTopics];
  
  const prompt = `
You are the content engine for a high-end "TikTok for Learning" app.
Your goal is to create "mind-blowing", "captivating" content that hooks the user immediately.

User Interests: ${interests.join(', ')}.
Trending/Liked: ${likedTopics.join(', ') || 'None yet'}.

Create a batch of 2 distinct lessons.

VARY THE CONTENT TYPE strictly among these three:
1. "story": A 5-slide narrative (e.g., "The untold story of how [Company] started" or "A day in the life of [Person]").
2. "infographic": List of 3-5 mind-blowing facts or stats about a topic.
3. "video": A standard script-based lesson with a strong hook (e.g., "Stop doing this...", "Did you know...").

Instructions:
- Be catchy enough to make even a gen-zer stop to read
- Tone: Conversational, energetic, thought-provoking, and inspiring.
- NO boring academic text. Make it sound like a viral creator.
- IMPORTANT: Keep "script" for videos concise (max 100 words) to avoid cutting off.
- For 'story', provide exactly 5 slides in the 'slides' array.
- For 'infographic', provide 4-5 short, punchy points in the 'points' array.

Return strictly a JSON array of objects.

JSON Schema:
[
  {
    "type": "story" | "infographic" | "video",
    "topic": "Specific Topic",
    "title": "Engaging Title",
    "script": "Script for video type (or null)",
    "slides": [{ "text": "Slide text..." }], // Only for story
    "points": ["Point 1", "Point 2"], // Only for infographic
    "keyTakeaway": "One sentence summary",
    "visualPrompt": "Abstract cinematic description for background",
    "likes": 120,
    "shares": 45,
    "comments": [{ "username": "user", "text": "comment", "avatar": "emoji" }],
    "quiz": { "question": "...", "options": ["..."], "correctIndex": 0 }
  }
]
`;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["story", "infographic", "video"] },
              topic: { type: Type.STRING },
              title: { type: Type.STRING },
              script: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING }
                  }
                }
              },
              points: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              keyTakeaway: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              likes: { type: Type.INTEGER },
              shares: { type: Type.INTEGER },
              comments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    username: { type: Type.STRING },
                    text: { type: Type.STRING },
                    avatar: { type: Type.STRING }
                  }
                }
              },
              quiz: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER }
                }
              }
            },
            required: ["type", "topic", "title", "keyTakeaway", "visualPrompt", "quiz", "likes", "shares", "comments"]
          }
        }
      }
    });

    if (!response.text) throw new Error("No text returned from Gemini");
    
    try {
      const data = JSON.parse(response.text);
      return data.map((item: any) => ({
        ...item,
        likedByUser: false,
        comments: item.comments || []
      }));
    } catch (e) {
      console.error("JSON Parse Error:", e);
      throw new Error("Failed to parse JSON response");
    }
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