import Groq from 'groq-sdk';

// Groq API key pool management
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

let currentKeyIndex = 0;

function getNextGroqClient(): Groq {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error('No Groq API keys available');
  }

  const apiKey = GROQ_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;

  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true // Allow browser usage
  });
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'llama-3.1-8b-instant'
): Promise<string> {
  const groq = getNextGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

export { getNextGroqClient };