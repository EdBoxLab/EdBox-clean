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
}

export interface GenerateResult {
  text: string;
  provider: 'gemini' | 'groq';
  success: boolean;
}

/**
 * Generate AI content with automatic Gemini -> Groq fallback
 */
export async function generateWithFallback(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, systemPrompt, schema, temperature = 1.0, maxTokens = 4000 } = options;

  // Try Gemini first
  try {
    console.log('🔵 Attempting Gemini generation...');
    const { GoogleGenAI, Type } = await import("@google/genai");
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config,
    });

    console.log('✅ Gemini generation successful');
    return {
      text: response.text,
      provider: 'gemini',
      success: true,
    };
  } catch (geminiError: any) {
    console.warn('⚠️ Gemini failed:', geminiError.message);
    console.log('🟢 Falling back to Groq...');

    // Fallback to Groq
    try {
      const Groq = (await import('groq-sdk')).default;
      const groq = new Groq({ apiKey: getNextGroqKey() });

      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: schema ? { type: 'json_object' } : undefined,
      });

      const text = response.choices[0]?.message?.content || '';
      console.log('✅ Groq generation successful');

      return {
        text,
        provider: 'groq',
        success: true,
      };
    } catch (groqError: any) {
      console.error('❌ Both Gemini and Groq failed');
      throw new Error(`AI generation failed: ${groqError.message}`);
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
