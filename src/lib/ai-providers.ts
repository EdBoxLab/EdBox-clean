/**
 * AI Provider Management Utility
 * Handles API key rotation for Gemini and Groq with automatic fallback
 */

// ============= API KEYS =============

const GEMINI_API_KEYS = [
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

const GROQ_API_KEYS = [
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

// src/lib/ai-providers.ts

/**
 * STRATEGY: Round-Robin Key Rotation
 * REASON: Prevents rate-limiting during heavy "Boardroom Level" usage.
 */
const LLAMA_CLOUD_KEYS = [
  process.env.LLAMA_CLOUD_KEY_1,
  process.env.LLAMA_CLOUD_KEY_2,
  process.env.LLAMA_CLOUD_KEY_3,
  process.env.LLAMA_CLOUD_KEY_4,
  process.env.LLAMA_CLOUD_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

export const getLlamaCloudKey = () => {
  if (LLAMA_CLOUD_KEYS.length === 0) {
    throw new Error("CRITICAL: No LlamaCloud Keys found in environment variables.");
  }
  const key = LLAMA_CLOUD_KEYS[currentKeyIndex];
  // Rotate to next key for the next request
  currentKeyIndex = (currentKeyIndex + 1) % LLAMA_CLOUD_KEYS.length;
  return key;
};
// ============= KEY ROTATION =============

let geminiKeyIndex = 0;
let groqKeyIndex = 0;

export function getNextGeminiKey(): string {
  if (GEMINI_API_KEYS.length === 0) throw new Error('No Gemini API keys configured');
  const key = GEMINI_API_KEYS[geminiKeyIndex];
  geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

export function getNextGroqKey(): string {
  if (GROQ_API_KEYS.length === 0) throw new Error('No Groq API keys configured');
  const key = GROQ_API_KEYS[groqKeyIndex];
  groqKeyIndex = (groqKeyIndex + 1) % GROQ_API_KEYS.length;
  return key;
}

// ============= AI GENERATION WITH FALLBACK =============

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
  model?: 'versatile' | 'oss';
}

export interface GenerateResult {
  text: string;
  provider: 'gemini' | 'groq';
  success: boolean;
}

/**
 * Generate embedding for a given text
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: getNextGeminiKey() });
    const model = ai.getGenerativeModel({ model: "embedding-001" });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Embedding failed:', error);
    throw error;
  }
}

/**
 * Clean AI response by removing markdown code blocks and extracting JSON
 */
export function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Handle cases where the model returns ```json { ... } ``` or similar
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  } else {
    // Sometimes it might return just { ... } with some text around it
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  return cleaned;
}

/**
 * Generate AI content with prioritized Groq (as requested by user)
 */
export async function generateWithFallback(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, systemPrompt, schema, temperature = 1.0, maxTokens = 4000, attachments = [], model = 'oss' } = options;

  const hasImages = attachments.some(a => a.mimeType.startsWith('image/'));

  // Determine model: vision for images, versatile for notes, oss for JSON tasks
  let groqModel = 'openai/gpt-oss-120b';
  if (hasImages) {
    groqModel = 'llama-3.2-11b-vision-preview';
  } else if (model === 'versatile') {
    groqModel = 'llama-3.3-70b-versatile';
  }

  // Try Groq FIRST (User preference: "let's not use gemini for now just groq")
  try {
    console.log(`🟢 Attempting Groq generation with model: ${groqModel}...`);
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: getNextGroqKey() });

    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    if (hasImages) {
      const userContent: any[] = [{ type: 'text', text: prompt }];
      attachments.forEach(attachment => {
        if (attachment.mimeType.startsWith('image/')) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${attachment.mimeType};base64,${attachment.data}`,
            },
          });
        }
      });
      messages.push({ role: 'user', content: userContent });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await groq.chat.completions.create({
      model: groqModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: schema ? { type: 'json_object' } : undefined,
    });

    const text = response.choices[0]?.message?.content || '';
    console.log('✅ Groq successful. Output sample:', text.substring(0, 100) + '...');

    return {
      text,
      provider: 'groq',
      success: true,
    };
  } catch (groqError: any) {
    console.warn('⚠️ Groq failed:', groqError.message);

    // Fallback to Gemini only as a last resort if Groq fails
    try {
      console.log('🔵 Falling back to Gemini as last resort...');
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: getNextGeminiKey() });

      const config: any = {
        temperature,
        maxOutputTokens: maxTokens,
      };

      if (systemPrompt) {
        config.systemInstruction = systemPrompt;
      }

      if (schema) {
        config.responseMimeType = "application/json";
        config.responseSchema = schema;
      }

      const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];

      if (attachments.length > 0) {
        attachments.forEach(attachment => {
          contents[0].parts.push({
            inlineData: {
              mimeType: attachment.mimeType,
              data: attachment.data,
            }
          });
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents,
        config,
      });

      console.log('✅ Gemini fallback successful');
      return {
        text: response.text,
        provider: 'gemini',
        success: true,
      };
    } catch (geminiError: any) {
      console.error('❌ Both Groq and Gemini failed');
      throw new Error(`AI generation failed: ${geminiError.message}`);
    }
  }
}


/**
 * Retry generation with exponential backoff
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
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Extract meaningful context and information from raw text using AI
 */
export async function extractContextFromText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  const systemPrompt = `You are an expert information extractor. Your task is to analyze raw text extracted from a document (PDF, PPTX, etc.) and extract the core context, key concepts, and meaningful information.

Constraints:
- Focus on the main topic and educational value.
- Identify the target audience if possible.
- Extract key terminology and definitions.
- Summarize the structure of the content.
- DO NOT just repeat the text; synthesize it into a concise knowledge summary.
- The summary should be optimized for another AI to use as context for generating educational materials.
- Max 1000 tokens for the summary.

Return the extraction in a clear, structured format.`;

  try {
    console.log('🧠 Extracting context from document text...');
    const result = await generateWithRetry({
      prompt: `Analyze the following raw text and extract meaningful context:\n\n${text.substring(0, 30000)}`,
      systemPrompt,
      temperature: 0.3, // Lower temperature for more factual extraction
      maxTokens: 1000,
    });
    console.log('✅ Context extraction complete');
    return result.text;
  } catch (error) {
    console.error('❌ Failed to extract context from text:', error);
    // Fallback to a simple truncation if AI extraction fails
    return text.substring(0, 5000);
  }
}
