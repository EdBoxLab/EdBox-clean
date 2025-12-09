
import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini with server-side key
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper for retries with exponential backoff (Server-side version)
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

export async function POST(req: Request) {
    try {
        const { interests, likedTopics } = await req.json();

        if (!interests || !Array.isArray(interests)) {
            return NextResponse.json({ error: "Invalid interests provided" }, { status: 400 });
        }

        const model = "gemini-2.5-flash";

        const prompt = `
You are the content engine for "EdBox", a high-end educational feed app designed to be as addictive as social media but for learning.
Your goal is not just to teach, but to HOOK the user immediately. Use "Dopamine-driven" design.

User Interests: ${interests.join(', ')}.
Trending/Liked: ${likedTopics?.join(', ') || 'None yet'}.

Create a batch of 3 distinct feed items.

VARY THE CONTENT TYPE strictly among these:
1. "story": A 5-slide visual narrative.
2. "infographic": List of 3-5 punchy facts.
3. "video": A short, engaging script.
4. "quiz": A fun single-question quiz.
5. "fact": A "Did you know?" style card.
6. "meme": A funny educational meme relating a concept to pop culture.

Engagement Rules (The "Mad Algorithm"):
- **Clickbait Titles**: Use curiosity gaps. e.g., "The Secret About Black Holes...", "Why You're Wrong About...", "The Mind-Blowing Truth...".
- **Pop Culture**: Relate complex topics to current memes, movies, or slang (without being cringe).
- **Variable Rewards**: Assign 'xp_reward' randomly between 50 (common), 150 (rare), and 500 (JACKPOT).
- **Emotion**: Aim to trigger one of these: Awe, Laughter, "Aha!" Moment, or Mild Shock.

Instructions per type:
- 'meme': MUST have a 'meme_template' (e.g., 'drake', 'distracted_boyfriend', 'two_buttons', 'expanding_brain', 'change_my_mind', 'success_kid') and funny top/bottom text. The concept should be educational but the delivery pure meme.
- 'story': 5 slides. Each slide needs short, punchy text and a highly visual 'image_prompt'.
- 'article': Use the format {Term|Definition} for key concepts. Keep it under 200 words but dense with value.

Return strictly a JSON array of objects.
`;

        const feedItems = await retryOperation(async () => {
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
                                type: { type: Type.STRING, enum: ["story", "infographic", "video", "quiz", "article", "challenge", "fact", "meme"] },
                                topic: { type: Type.STRING },
                                title: { type: Type.STRING },
                                // Common fields
                                xp_reward: { type: Type.INTEGER },
                                genie_reaction: { type: Type.STRING },
                                theme: { type: Type.STRING },

                                // Type specific fields
                                script: { type: Type.STRING }, // Video
                                points: { type: Type.ARRAY, items: { type: Type.STRING } }, // Infographic

                                // Story
                                slides: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            text: { type: Type.STRING },
                                            visualDetail: { type: Type.STRING },
                                            image_prompt: { type: Type.STRING }
                                        }
                                    }
                                },

                                // Quiz
                                question: { type: Type.STRING }, // Also for Challenge
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING }, // Also for Challenge
                                correctIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }, // Also for Fact

                                // Challenge
                                time_limit: { type: Type.INTEGER },
                                streak_bonus: { type: Type.BOOLEAN },

                                // Meme
                                concept: { type: Type.STRING },
                                meme_template: { type: Type.STRING },
                                top_text: { type: Type.STRING },
                                bottom_text: { type: Type.STRING },

                                // Article
                                summary: { type: Type.STRING },
                                full_article_content: { type: Type.STRING },

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
                                }
                            },
                            required: ["type", "topic", "title", "visualPrompt", "xp_reward", "theme"]
                        }
                    }
                }
            });

            if (!response.text) throw new Error("No text returned from Gemini");

            try {
                const data = JSON.parse(response.text);
                // Add IDs server-side or client-side? Server-side is fine.
                return data.map((item: any) => ({
                    ...item,
                    id: crypto.randomUUID(),
                    likedByUser: false,
                    comments: item.comments || []
                }));
            } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("Failed to parse JSON response");
            }
        });

        return NextResponse.json(feedItems);

    } catch (error: any) {
        console.error("Feed generation failed:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
