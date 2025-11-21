'use server'
import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse, type NextRequest } from "next/server";


// Schema for a single feed item object
const singleItemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "A unique identifier string, e.g., 'card11'." },
        type: { type: Type.STRING, enum: ['quiz', 'article', 'challenge', 'fact', 'story'] },
        xp_reward: { type: Type.INTEGER },
        genie_reaction: { type: Type.STRING, enum: ['cheer', 'wink', 'hint', 'hype', 'default', 'sad'] },
        theme: { type: Type.STRING, enum: ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient', 'red-gradient'] },
        title: { type: Type.STRING },
        // Story
        slides: {
            type: Type.ARRAY,
            description: "Required for 'story' type. An array of 5-20 slide objects.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "A short paragraph of the story for this slide." },
                    image_prompt: { type: Type.STRING, description: "A detailed, visually rich prompt for an image that illustrates the text. IMPORTANT: The prompt MUST instruct the model to render the 'text' value clearly and legibly onto the image itself." }
                },
                required: ["text", "image_prompt"]
            }
        },
        // Quiz
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        answer: { type: Type.STRING },
        streak_bonus: { type: Type.BOOLEAN },
        /* // Video
        prompt: { type: Type.STRING, description: "Required for 'video' type. A prompt for video generation." },
        placeholder_image_prompt: { type: Type.STRING, description: "Required for 'video' type. A visually descriptive prompt for generating a placeholder image." }, */
        // Quiz, Article, Challenge, Fact
        image_prompt: { type: Type.STRING, description: "Optional for quiz/article/challenge, required for fact. A visually descriptive prompt for an image related to the card's content." },
        // Article
        summary: { type: Type.STRING },
        full_article_content: { 
            type: Type.STRING,
            description: "2-3 paragraphs. MUST embed interactive elements: `{Term|Definition}` for definitions and `[QUIZ:Question|Opt1,Opt2,Opt3|Correct Answer]` for mini-quizzes."
        },
        // Challenge
        question: { type: Type.STRING },
        time_limit: { type: Type.INTEGER },
        // Fact
        explanation: { type: Type.STRING, description: "Required for 'fact' type. A short, engaging explanation of the fact."}
    },
    required: ["id", "type", "xp_reward", "genie_reaction", "theme", "title"]
};

// New schema for multiple items
const multiItemSchema = {
    type: Type.OBJECT,
    properties: {
        feed_items: {
            type: Type.ARRAY,
            description: "An array of unique feed item objects.",
            items: singleItemSchema
        }
    },
    required: ["feed_items"]
};

/**
 * Attempts to parse a JSON string. If it fails, it asks the Gemini API to repair it.
 * This provides a robust fallback for malformed JSON responses.
 */
const parseOrRepairJson = async (text: string, ai: any): Promise<any> => {
    try {
        // First, attempt to parse the string as-is.
        return JSON.parse(text);
    } catch (error) {
        console.warn("Initial JSON.parse failed. Attempting to repair with Gemini.", { originalText: text, error });
        
        // If parsing fails, create a prompt to ask Gemini to fix the JSON.
        const prompt = `
        The following text is a malformed JSON string. Please correct any syntax errors (e.g., missing commas, unescaped double quotes, trailing commas) and return ONLY the raw, valid JSON object. Do not add any explanatory text, markdown fences, or other wrappers.

        Malformed string:
        ${text}
        `;
        
      // corrected code
try {
  // Call the API with the repair prompt.
  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
  });
  
  const repairedText = result.text?.trim();

  if (repairedText) {
      // Attempt to parse the repaired text.
      return JSON.parse(repairedText);
  } else {
      throw new Error("Gemini repair API returned empty or undefined text.");
  }
} catch (repairError) {
  console.error("Failed to repair and parse JSON.", { repairError, originalText: text });
  // If even the repair fails, re-throw the actual API error to be handled by the caller.
  throw repairError;
}

    }
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            count, interests, positiveTopics,
            negativeTopics, existingIds, existingTitles
        } = body;

        const ai = new GoogleGenAI(process.env.API_KEY as string);

        const positiveSignals = positiveTopics.length > 0
            ? `The user seems to be enjoying topics related to "${positiveTopics.slice(-5).join('; ')}". You should generate content related to these topics.`
            : 'None yet. Focus on their core interests.';
        const negativeSignals = negativeTopics.length > 0
            ? `They have been skipping or disliking content about "${negativeTopics.slice(-5).join('; ')}". You must avoid these topics.`
            : 'None yet.';

        const prompt = `
    Generate an array of ${count} unique and engaging educational feed item objects for a learning app called EdBox.

    **User Profile & Context:**
    - Core Interests: "${interests.join(', ')}".
    - Recent Positive Signals: ${positiveSignals}
    - Recent Negative Signals: ${negativeSignals}
    - Existing Content Titles: "${existingTitles}". Generate new, different topics.
    - Existing IDs: ${existingIds}. Generate new unique IDs.

    **Strategy:**
    - The ${count} items should cover different topics based on the user's interests and signals.
    - If there are positive signals, HEAVILY FAVOR topics related to them.
    - STRICTLY AVOID topics related to negative signals.
    - **CRITICAL: Ensure a good mix of 'quiz', 'article', 'challenge', 'fact', and 'story' types across the ${count} items. Do NOT return only one type.**
    
    **Content Rules & Style Guide:**
    - Each item must have a unique ID (e.g., 'card- followed by a number').
    - 'fact' cards MUST have a detailed, visually rich 'image_prompt'.
    /* - 'video' cards MUST have a 'prompt' for video generation and a separate, detailed 'placeholder_image_prompt'. */
    - 'article' cards' 'full_article_content' MUST embed interactive elements: \`{Term|Definition}\` and \`[QUIZ:Question|Opt1,Opt2,Opt3|Correct Answer]\`.
    - 'quiz' & 'challenge' cards MAY have an 'image_prompt'.

    - **'story' cards:** These are the most important. They must be visually stunning and emotionally resonant, like a high-quality Instagram post.
      - They need a 'title' and a 'slides' array (5-10 slides).
      - Each slide object has 'text' and an 'image_prompt'.
      - **Crucial instructions for 'image_prompt':** The prompt must generate a highly artistic, non-literal, and symbolic image that captures the *feeling* of the slide's text.
        - **Style:** Think cinematic, moody, ethereal digital art. Use keywords like "silhouette of a person", "glowing energy", "nebula background", "dramatic lighting", "double exposure effect", "abstract particles".
        - **Text Integration:** The 'image_prompt' MUST instruct the image model to render the slide's 'text' directly and beautifully onto the image. The text should be part of the art itself.
          - **Good Example:** \`"image_prompt": "A silhouette of a person looking at a vast, starry nebula. In the center, the words 'The cosmos is within us' are formed by glowing constellations in a modern, elegant sans-serif font."\`
          - **Bad Example:** \`"image_prompt": "A photo of space with text at the bottom."\`
        - **Goal:** Create an 'Instagram-worthy' image that makes the user feel something and admire the visuals, not just a simple illustration.

    **CRITICAL JSON FORMATTING RULES:**
    1.  **Output MUST be a single, valid JSON object with a single key "feed_items" containing an array of ${count} item objects.** Do not wrap it in markdown \`\`\`json fences or add any explanatory text.
    2.  **ESCAPE ALL DOUBLE QUOTES inside string values.** This is crucial. If you need a double quote inside a string, use a backslash (\\).
        -   **CORRECT EXAMPLE:** \`"title": "Exploring the \\"Ring of Fire\\""\`
        -   **INCORRECT EXAMPLE:** \`"title": "Exploring the "Ring of Fire""\`
    `;

        const apiCall = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert content creator for a mobile learning application. Your responses must be structured, adhere strictly to the provided JSON schema, and be highly engaging for users.",
                responseMimeType: 'application/json',
                responseSchema: multiItemSchema,
            },
        });

        const result = await apiCall;
        let jsonText = result.text?.trim() ?? "";

        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*/, "").replace(/```$/, "").trim();
        }

        const parsedObject = await parseOrRepairJson(jsonText, ai);
        const feedItems = parsedObject.feed_items;

        return NextResponse.json({ feed_items: feedItems });

    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json({ error: 'Failed to generate feed items.' }, { status: 500 });
    }
}
