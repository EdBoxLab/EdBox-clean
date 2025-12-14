import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { FeedItem } from '@/types/feed';

// ============= CONFIGURATION =============
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Simple Key Pool for Groq if multiple keys exist (reusing your existing pattern simply)
const GROQ_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

const getRandomGroqKey = () => GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

// ============= YOUTUBE SEARCH =============

async function searchYouTubeVideos(query: string, limit = 2): Promise<any[]> {
    if (!YOUTUBE_API_KEY) {
        console.error("❌ No YouTube API Key configured");
        return [];
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&key=${YOUTUBE_API_KEY}`;
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

async function generateFeedWithGroq(interests: string[], likedTopics: string[]): Promise<FeedItem[]> {
    const apiKey = getRandomGroqKey();
    if (!apiKey) throw new Error("No Groq API Keys available");

    const groq = new Groq({ apiKey });

    // Mix interests and liked topics, prioritizing liked ones slightly
    const focusTopics = [...interests, ...likedTopics].slice(0, 5);
    const prompt = `
    Generate 8 diverse educational feed items for a user interested in: ${focusTopics.join(', ')}.
    
    You must generate exactly these types (one of each):
    1. One 'quiz' item - Interactive multiple choice question
    2. One 'article' item - Educational article with summary
    3. One 'fact' item - Interesting fact with explanation
    4. One 'challenge' item - Quick brain teaser or problem
    5. One 'story' item - Short educational narrative
    6. One additional 'quiz' item (different topic)
    7. One additional 'fact' item (different topic)  
    8. One additional 'article' item (different topic)

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
        const { interests = [], likedTopics = [] } = body;

        console.log('Generating feed for:', interests.length, 'interests');

        // 1. Generate text content via Groq
        const textItems = await generateFeedWithGroq(interests, likedTopics);

        // 2. Fetch relevant videos from YouTube (limit to 1-2 to balance content)
        const videoItems: FeedItem[] = [];
        if (interests.length > 0) {
            const query = `${interests[0]} tutorial educational short`;
            const videos = await searchYouTubeVideos(query, 1); // Reduced to 1 video

            videos.forEach(v => {
                videoItems.push({
                    id: `vid_${v.id}`,
                    type: 'video',
                    topic: interests[0],
                    title: v.title.length > 60 ? v.title.substring(0, 57) + '...' : v.title,
                    xp_reward: 150,
                    genie_reaction: 'hype',
                    theme: 'red-gradient',
                    likedByUser: false,
                    likes: Math.floor(Math.random() * 100),
                    shares: Math.floor(Math.random() * 30),
                    comments: [],
                    // Video specific
                    script: v.description.substring(0, 200) + '...',
                    visualPrompt: 'educational_video_content',
                    imageUrl: v.thumbnail,
                    video_url: `https://www.youtube.com/embed/${v.id}`
                } as any);
            });
        }

        // 3. Add YouTube Shorts (simulated as short videos)
        if (interests.length > 1) {
            const shortsQuery = `${interests[1]} quick facts shorts`;
            const shorts = await searchYouTubeVideos(shortsQuery, 1);
            
            shorts.forEach(s => {
                videoItems.push({
                    id: `short_${s.id}`,
                    type: 'video',
                    topic: interests[1],
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

        // 4. Combine and Shuffle for variety
        const finalFeed = [...textItems, ...videoItems].sort(() => Math.random() - 0.5);

        return NextResponse.json(finalFeed);

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}