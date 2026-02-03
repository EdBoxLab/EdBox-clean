/**
 * AI Provider Management Utility
 * Handles API key rotation for Gemini and Groq with automatic fallback
 * 
 * STRATEGY: 
 * 1. Loop through ALL Groq keys (Priority)
 * 2. If all Groq keys fail, loop through ALL Gemini keys
 * 3. Use Voyage AI for all embeddings (Primary)
 * 4. Continuity handover ensures seamless explanation across key rotations
 */

import { VoyageAIClient } from 'voyageai';

// ============= KEY HELPERS =============

function getGeminiKeys(): string[] {
  return [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
    process.env.GEMINI_API_KEY_11,
    process.env.GEMINI_API_KEY_12,
    process.env.GEMINI_API_KEY_13,
    process.env.GEMINI_API_KEY_14,
    process.env.GEMINI_API_KEY_15,
  ].filter(Boolean) as string[];
}

function getGroqKeys(): string[] {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7,
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_9,
    process.env.GROQ_API_KEY_10,
    process.env.GROQ_API_KEY_11,
    process.env.GROQ_API_KEY_12,
    process.env.GROQ_API_KEY_13,
    process.env.GROQ_API_KEY_14,
    process.env.GROQ_API_KEY_15,
    process.env.GROQ_API_KEY_16,
    process.env.GROQ_API_KEY_17,
    process.env.GROQ_API_KEY_18,
    process.env.GROQ_API_KEY_19,
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_21,
    process.env.GROQ_API_KEY_22,
    process.env.GROQ_API_KEY_23,
    process.env.GROQ_API_KEY_24,
    process.env.GROQ_API_KEY_25,
    process.env.GROQ_API_KEY_26,
    process.env.GROQ_API_KEY_27,
    process.env.GROQ_API_KEY_28,
    process.env.GROQ_API_KEY_29,
    process.env.GROQ_API_KEY_30,
    process.env.GROQ_API_KEY_31,
    process.env.GROQ_API_KEY_32,
    process.env.GROQ_API_KEY_33,
    process.env.GROQ_API_KEY_34,
    process.env.GROQ_API_KEY_35,
    process.env.GROQ_API_KEY_36,
    process.env.GROQ_API_KEY_37,
    process.env.GROQ_API_KEY_38,
  ].filter(Boolean) as string[];
}

function getLlamaCloudKeys(): string[] {
  return [
    process.env.LLAMA_CLOUD_KEY_1,
    process.env.LLAMA_CLOUD_KEY_2,
    process.env.LLAMA_CLOUD_KEY_3,
    process.env.LLAMA_CLOUD_KEY_4,
    process.env.LLAMA_CLOUD_KEY_5,
  ].filter(Boolean) as string[];
}

function getOpenRouterKeys(): string[] {
  return [
    process.env.OPEN_ROUTER_KEY_1,
    process.env.OPEN_ROUTER_KEY_2,
    process.env.OPEN_ROUTER_KEY_3,
  ].filter(Boolean) as string[];
}

// ============= KEY ROTATION STATE =============

let geminiKeyIndex = 0;
let groqKeyIndex = 0;
let llamaKeyIndex = 0;
let openRouterKeyIndex = 0;

// Persistent exhausted keys tracking (cleared every hour)
const exhaustedKeys = new Set<string>();
setInterval(() => exhaustedKeys.clear(), 3600000);

export function getNextGeminiKey(): string {
  const keys = getGeminiKeys().filter(k => !exhaustedKeys.has(k));
  if (keys.length === 0) {
    exhaustedKeys.clear(); // Emergency reset if all are exhausted
    return getGeminiKeys()[0];
  }
  const key = keys[geminiKeyIndex % keys.length];
  geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
  return key;
}

export function getNextGroqKey(): string {
  const keys = getGroqKeys().filter(k => !exhaustedKeys.has(k));
  if (keys.length === 0) {
    exhaustedKeys.clear();
    return getGroqKeys()[0];
  }
  const key = keys[groqKeyIndex % keys.length];
  groqKeyIndex = (groqKeyIndex + 1) % keys.length;
  return key;
}

export function getLlamaCloudKey(): string {
  const keys = getLlamaCloudKeys().filter(k => !exhaustedKeys.has(k));
  if (keys.length === 0) {
    exhaustedKeys.clear();
    return getLlamaCloudKeys()[0];
  }
  const key = keys[llamaKeyIndex % keys.length];
  llamaKeyIndex = (llamaKeyIndex + 1) % keys.length;
  return key;
}

export function getNextOpenRouterKey(): string {
  const keys = getOpenRouterKeys().filter(k => !exhaustedKeys.has(k));
  if (keys.length === 0) {
    exhaustedKeys.clear();
    return getOpenRouterKeys()[0];
  }
  const key = keys[openRouterKeyIndex % keys.length];
  openRouterKeyIndex = (openRouterKeyIndex + 1) % keys.length;
  return key;
}

// ============= INTERFACES =============

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  schema?: any;
  temperature?: number;
  maxTokens?: number;
  attachments?: {
    mimeType: string;
    data: string; // base64
  }[];
  model?: 'versatile' | 'oss' | 'vision' | 'llama-3.3-70b-versatile';
  continuationContext?: string; // Used to resume from partial responses
}

export interface GenerateResult {
  text: string;
  provider: 'gemini' | 'groq' | 'huggingface' | 'local' | 'openrouter';
  success: boolean;
}

// ============= CONTINUITY HELPERS =============

/**
 * Creates a continuation prompt for the next AI if the current one fails mid-stream
 */
function createContinuationPrompt(originalPrompt: string, accumulatedText: string): string {
  if (!accumulatedText) return originalPrompt;

  // Take the last 500 chars to avoid prompt bloat but give enough context
  const recentContext = accumulatedText.slice(-500);

  return `[CONTINUATION REQUEST]
The previous AI provider was cut off while explaining. 
What was already said: "...${recentContext}"

TASK: Continue the explanation exactly from where it left off. 
Do NOT repeat the beginning. Start immediately with the next word or sentence fragment.
Original Request: ${originalPrompt}`;
}

// ============= CORE AI METHODS =============

/**
 * Robust streaming with automatic failover and continuity preservation
 */
export async function* streamWithFallback(options: GenerateOptions): AsyncGenerator<string> {
  const { prompt, systemPrompt, temperature = 0.7, maxTokens = 4000, attachments = [] }: GenerateOptions = options;
  const model = options.model || 'oss';
  const hasImages = attachments.some(a => a.mimeType.startsWith('image/')) || model === 'vision';
  let accumulatedText = '';

  // 0. TRY OPENROUTER FOR VISION REQUESTS
  if (hasImages || (model as any) === 'vision') {
    const openRouterKeys = getOpenRouterKeys();
    for (const key of openRouterKeys) {
      if (exhaustedKeys.has(key)) continue;

      try {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

        const userContent: any[] = [{ type: 'text', text: prompt }];
        attachments.forEach(attachment => {
          if (attachment.mimeType.startsWith('image/')) {
            userContent.push({
              type: 'image_url',
              image_url: { url: `data:${attachment.mimeType};base64,${attachment.data}` },
            });
          }
        });
        messages.push({ role: 'user', content: userContent });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://edbox.app',
            'X-Title': 'EdBox',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'OpenRouter API error');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    accumulatedText += content;
                    yield content;
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
          return; // Success
        }
      } catch (orError: any) {
        if (orError.status === 429 || orError.message?.includes('rate limit')) {
          exhaustedKeys.add(key);
          console.warn(`⚠️ OpenRouter key exhausted mid-stream, rotating...`);
          continue;
        }
        console.error(`❌ OpenRouter streaming error: ${orError.message}`);
        break; // Try Groq/Gemini
      }
    }
  }

  // 1. TRY ALL GROQ KEYS
  const groqKeys = getGroqKeys();
  let keyIndex = 0;

  while (keyIndex < groqKeys.length) {
    const key = groqKeys[keyIndex];
    if (exhaustedKeys.has(key)) {
      keyIndex++;
      continue;
    }

    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey: key });

      // Groq vision is decommissioned, only use for text
      const groqModel = 'llama-3.3-70b-versatile';

      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

      // If we have accumulated text, we are resuming
      if (accumulatedText) {
        messages.push({ role: 'user', content: createContinuationPrompt(prompt, accumulatedText) });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const stream = await groq.chat.completions.create({
        model: groqModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          accumulatedText += content;
          yield content;
        }
      }

      // If we finished successfully, return
      return;

    } catch (error: any) {
      const isRateLimit = error.status === 429 || error.message?.includes('rate limit');
      if (isRateLimit) {
        exhaustedKeys.add(key);
        console.warn(`⚠️ Groq key ${keyIndex + 1} exhausted mid-stream, rotating...`);
        keyIndex++;
        continue;
      }
      console.error(`❌ Groq streaming error: ${error.message}`);
      break; // Try Gemini
    }
  }

  // 2. FALLBACK TO ALL GEMINI KEYS
  const geminiKeys = getGeminiKeys();
  let geminiIndex = 0;

  while (geminiIndex < geminiKeys.length) {
    const key = geminiKeys[geminiIndex];
    if (exhaustedKeys.has(key)) {
      geminiIndex++;
      continue;
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(key);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt
      });

      const contents: any[] = [];
      if (accumulatedText) {
        contents.push({ role: 'user', parts: [{ text: createContinuationPrompt(prompt, accumulatedText) }] });
      } else {
        contents.push({ role: 'user', parts: [{ text: prompt }] });
      }

      const result = await geminiModel.generateContentStream({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } });

      for await (const chunk of result.stream) {
        const content = chunk.text();
        if (content) {
          accumulatedText += content;
          yield content;
        }
      }

      return;

    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
      if (isRateLimit) {
        exhaustedKeys.add(key);
        console.warn(`⚠️ Gemini key ${geminiIndex + 1} exhausted mid-stream, rotating...`);
        geminiIndex++;
        continue;
      }
      console.error(`❌ Gemini streaming error: ${error.message}`);
      break;
    }
  }

  throw new Error('Streaming failed across all providers and keys.');
}

/**
 * Generate embedding for a given text with robust fallbacks
 * VOYAGE AI is the primary provider for high-quality embeddings
 */
export async function embedText(text: string): Promise<number[]> {
  // 1. Try Voyage AI (Primary)
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (voyageKey) {
    try {
      const client = new VoyageAIClient({ apiKey: voyageKey });
      const response = await client.embed({
        input: text,
        model: 'voyage-3', // High performance, low latency
        inputType: 'document'
      });
      if (response.data?.[0]?.embedding) {
        return response.data[0].embedding;
      }
    } catch (error: any) {
      console.warn(`⚠️ Voyage AI embedding failed: ${error.message}`);
    }
  }

  // 2. Try ALL LlamaCloud Keys (Secondary)
  const llamaKeys = getLlamaCloudKeys();
  for (const key of llamaKeys) {
    if (exhaustedKeys.has(key)) continue;
    try {
      const response = await fetch('https://api.llamacloud.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: [text],
          model: 'bge-base-en-v1.5'
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data?.[0]?.embedding) return data.data[0].embedding;
      } else if (response.status === 429) {
        exhaustedKeys.add(key);
      }
    } catch (error: any) {
      console.warn(`⚠️ LlamaCloud key failed: ${error.message}`);
    }
  }

  // 3. Try ALL Gemini Keys (Tertiary)
  const geminiKeys = getGeminiKeys();
  for (const key of geminiKeys) {
    if (exhaustedKeys.has(key)) continue;
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      if (result.embedding?.values) return result.embedding.values;
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
      if (isRateLimit) {
        exhaustedKeys.add(key);
        console.warn(`⚠️ Gemini key exhausted, rotating...`);
        continue;
      }
      console.warn(`⚠️ Gemini embedding error: ${error.message}`);
      break;
    }
  }

  throw new Error('Embedding failed across all keys and providers (Voyage, LlamaCloud, Gemini)');
}

/**
 * Clean AI response
 */
export function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  } else {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }
  return cleaned;
}

/**
 * Generate AI content with prioritized Groq Loop then Gemini Loop
 */
export async function generateWithFallback(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, systemPrompt, schema, temperature = 0.7, maxTokens = 4000, attachments = [] }: GenerateOptions = options;
  const model = options.model || 'oss';
  const hasImages = attachments.some(a => a.mimeType.startsWith('image/')) || model === 'vision';

  // 0. TRY OPENROUTER FOR VISION REQUESTS OR IF EXPLICITLY REQUESTED
  if (hasImages || (model as any) === 'vision') {
    const openRouterKeys = getOpenRouterKeys();
    for (const key of openRouterKeys) {
      if (exhaustedKeys.has(key)) continue;
      try {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

        const userContent: any[] = [{ type: 'text', text: prompt }];
        attachments.forEach(attachment => {
          if (attachment.mimeType.startsWith('image/')) {
            userContent.push({
              type: 'image_url',
              image_url: { url: `data:${attachment.mimeType};base64,${attachment.data}` },
            });
          }
        });
        messages.push({ role: 'user', content: userContent });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://edbox.app',
            'X-Title': 'EdBox',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages,
            temperature,
            max_tokens: maxTokens,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'OpenRouter API error');
        }

        const data = await response.json();
        return {
          text: data.choices[0]?.message?.content || '',
          provider: 'openrouter',
          success: true,
        };
      } catch (orError: any) {
        if (orError.status === 429 || orError.message?.includes('rate limit')) {
          exhaustedKeys.add(key);
          console.warn(`⚠️ OpenRouter key exhausted, trying next...`);
          continue;
        }
        console.warn(`⚠️ OpenRouter error: ${orError.message}`);
        break; // Try fallbacks
      }
    }
  }

  // 1. TRY ALL GROQ KEYS FIRST
  const groqKeys = getGroqKeys();
  for (const key of groqKeys) {
    if (exhaustedKeys.has(key)) continue;
    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey: key });

      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

      // Groq vision model is decommissioned, so we've handled vision above.
      // If images somehow reach here, we'll strip them to avoid errors.
      messages.push({ role: 'user', content: prompt });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: schema ? { type: 'json_object' } : undefined,
      });

      return {
        text: response.choices[0]?.message?.content || '',
        provider: 'groq',
        success: true,
      };
    } catch (groqError: any) {
      if (groqError.status === 429 || groqError.message?.includes('rate limit')) {
        exhaustedKeys.add(key);
        console.warn(`⚠️ Groq key exhausted, trying next...`);
        continue;
      }
      console.warn(`⚠️ Groq error with key: ${groqError.message}`);
      break; // Non-rate-limit error, move to Gemini
    }
  }

  // 2. FALLBACK TO ALL GEMINI KEYS
  const geminiKeys = getGeminiKeys();
  for (const key of geminiKeys) {
    if (exhaustedKeys.has(key)) continue;
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(key);

      const config: any = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      if (schema) {
        config.responseMimeType = "application/json";
      }

      const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
      if (attachments.length > 0) {
        attachments.forEach(attachment => {
          contents[0].parts.push({
            inlineData: { mimeType: attachment.mimeType, data: attachment.data }
          });
        });
      }

      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt
      });

      const result = await geminiModel.generateContent({ contents, generationConfig: config });
      const response = await result.response;

      return {
        text: response.text(),
        provider: 'gemini',
        success: true,
      };
    } catch (geminiError: any) {
      const isRateLimit = geminiError.message?.includes('429') || geminiError.message?.includes('quota');
      if (isRateLimit) {
        exhaustedKeys.add(key);
        console.warn(`⚠️ Gemini key exhausted, trying next...`);
        continue;
      }
      console.error(`❌ Gemini error: ${geminiError.message}`);
      break;
    }
  }

  throw new Error('AI generation failed: All Groq and Gemini keys are exhausted or errored.');
}

/**
 * Retry generation
 */
export async function generateWithRetry(
  options: GenerateOptions,
  maxRetries = 3,
  baseDelay = 1000
): Promise<GenerateResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateWithFallback(options);
    } catch (error: any) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Split text into chunks for intelligent processing
 */
export function chunkText(text: string, chunkSize: number = 20000): string[] {
  const chunks: string[] = [];
  let currentPos = 0;
  while (currentPos < text.length) {
    chunks.push(text.substring(currentPos, currentPos + chunkSize));
    currentPos += chunkSize;
  }
  return chunks;
}

/**
 * Unified context extraction with support for multi-chapter chunking
 */
export async function extractContextFromText(text: string): Promise<string[]> {
  if (!text?.trim()) return [''];

  // If text is small (less than ~5 pages), process as a single chunk
  if (text.length < 15000) {
    const systemPrompt = `Analyze the raw text and extract core context, key concepts, and structure. Summarize for educational use.`;
    try {
      const result = await generateWithRetry({
        prompt: `Analyze:\n\n${text}`,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });
      return [result.text];
    } catch (error) {
      return [text.substring(0, 5000)];
    }
  }

  // For large text, split into logical chapters/chunks (approx 5-7 pages each)
  const chunks = chunkText(text, 15000);
  const contextPromises = chunks.map(async (chunk, i) => {
    const systemPrompt = `Analyze section ${i + 1} of this document. Extract the major strategic themes, key definitions, and critical concepts for this specific part.`;
    try {
      const result = await generateWithRetry({
        prompt: `Analyze Section ${i + 1}:\n\n${chunk}`,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 800,
      });
      return result.text;
    } catch (error) {
      return chunk.substring(0, 3000);
    }
  });

  return Promise.all(contextPromises);
}
