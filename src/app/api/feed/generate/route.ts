import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { FeedItem } from '@/types/feed';

// ============= CONFIGURATION =============
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Simple Key Pool for Groq if multiple keys exist (reusing your existing pattern simply)
const GROQ_KEYS = [
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_7,
].filter(Boolean) as string[];
console.log(GROQ_KEYS);
const getRandomGroqKey = () => GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

// ============= YOUTUBE SEARCH =============

async function searchYouTubeVideos(query: string, limit = 2): Promise<any[]> {
    if (!YOUTUBE_API_KEY) {
        console.error("❌ No YouTube API Key configured");
        return [];
    }

    try {
        // Search for shorts specifically by adding duration filter and shorts-related terms
        const shortsQuery = `${query} #shorts short video under 60 seconds`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(shortsQuery)}&type=video&maxResults=${limit}&videoDuration=short&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url
        }));
    } catch (error) {
        console.error("YouTube Search Error:", error);
        return [];
    }
}

// ============= GROQ GENERATION =============

async function generateFeedWithGroq(interests: string[], likedTopics: string[], excludeTypes: string[] = []): Promise<FeedItem[]> {
    const apiKey = getRandomGroqKey();
    if (!apiKey) throw new Error("No Groq API Keys available");

    const groq = new Groq({ apiKey });

    // Mix interests and liked topics, prioritizing liked ones slightly
    const focusTopics = [...interests, ...likedTopics].slice(0, 5);
    
    // Define available content types
    const allTypes = ['quiz', 'article', 'fact', 'challenge', 'story'];
    const availableTypes = allTypes.filter(type => !excludeTypes.includes(type));
    
    // Generate 8 diverse types, ensuring no duplicates within this batch
    const selectedTypes = [];
    while (selectedTypes.length < 8 && availableTypes.length > 0) {
        // First pass: add each type once
        if (selectedTypes.length < availableTypes.length) {
            selectedTypes.push(availableTypes[selectedTypes.length]);
        } else {
            // Second pass: add remaining types randomly
            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            selectedTypes.push(randomType);
        }
    }

    const prompt = `
    Generate 8 diverse educational feed items for a user interested in: ${focusTopics.join(', ')}.
    
    You must generate exactly these types in order:
    ${selectedTypes.map((type, i) => `${i + 1}. One '${type}' item`).join('\n    ')}

    Return a JSON array with exactly 8 objects. Each object must have these base fields:
    - id: unique string like "quiz_001", "fact_002", etc.
    - type: 'quiz' | 'article' | 'fact' | 'challenge' | 'story'
    - topic: which interest/topic this relates to from the provided list
    - title: engaging, clickable headline (max 60 chars)
    - xp_reward: number between 75-250 based on difficulty
    - theme: randomly pick from 'purple-gradient' | 'blue-gradient' | 'green-gradient' | 'orange-gradient' | 'red-gradient'
    - likes: random number 0-50
    - likedByUser: false
    - shares: random number 0-20
    - comments: empty array []
    - genie_reaction: randomly pick from 'cheer' | 'wink' | 'hint' | 'hype'
    
    SPECIFIC FIELDS BY TYPE:
    
    QUIZ items need:
    - question: clear question (max 100 chars)
    - options: array of exactly 4 answer choices
    - answer: the correct answer text (must match one of the options exactly)
    - correctIndex: index (0-3) of correct answer in options array
    - explanation: why this answer is correct (1-2 sentences)
    - streak_bonus: randomly true/false
    
    ARTICLE items need:
    - summary: 1-2 sentence summary
    - full_article_content: 3-4 paragraphs of educational content
    - visualPrompt: description for background imagery
    
    FACT items need:
    - explanation: 2-3 sentences explaining the fact
    - visualPrompt: description for background imagery
    - imageGenerationState: "ready"
    
    CHALLENGE items need:
    - question: the challenge/problem statement
    - answer: the solution/correct answer
    - time_limit: seconds (30-120)
    - streak_bonus: randomly true/false
    
    STORY items need:
    - slides: array of 3-5 objects with {text: "slide content"}
    - visualPrompt: description for story atmosphere/setting
    
    CRITICAL: Output ONLY valid JSON array. No markdown, no explanations, no code blocks.
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-70b-versatile',
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        // Handle if LLM wraps in { "items": [...] } or just returns [...]
        const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.feed || []);

        return items;
    } catch (e) {
        console.error("Groq Gen Error:", e);
        return [];
    }
}

// ============= MAIN HANDLER =============

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { interests = [], likedTopics = [], excludeTypes = [] } = body;

        console.log('Generating feed for:', interests.length, 'interests', 'excluding:', excludeTypes);

        // 1. Generate text content via Groq
        const textItems = await generateFeedWithGroq(interests, likedTopics, excludeTypes);

        // 2. Add YouTube Shorts only (no regular videos)
        const videoItems: FeedItem[] = [];
        if (interests.length > 0) {
            const shortsQuery = `${interests[0]} shorts quick facts tutorial`;
            const shorts = await searchYouTubeVideos(shortsQuery, 2); // Get 2 shorts to fill the 10-item batch
            
            shorts.forEach((s, index) => {
                videoItems.push({
                    id: `short_${s.id}`,
                    type: 'video',
                    topic: interests[index % interests.length],
                    title: `🔥 ${s.title.length > 50 ? s.title.substring(0, 47) + '...' : s.title}`,
                    xp_reward: 75,
                    genie_reaction: 'cheer',
                    theme: 'orange-gradient',
                    likedByUser: false,
                    likes: Math.floor(Math.random() * 200),
                    shares: Math.floor(Math.random() * 50),
                    comments: [],
                    script: s.description.substring(0, 150) + '...',
                    visualPrompt: 'short_form_content',
                    imageUrl: s.thumbnail,
                    video_url: `https://www.youtube.com/embed/${s.id}`
                } as any);
            });
        }

        // 3. Combine to make exactly 10 items and shuffle for variety
        const finalFeed = [...textItems, ...videoItems].slice(0, 10).sort(() => Math.random() - 0.5);

        return NextResponse.json(finalFeed);

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}