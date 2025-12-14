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
    Generate 5 distinct educational feed items for a user interested in: ${focusTopics.join(', ')}.
    
    You must generate exactly:
    1. One 'quiz' item
    2. One 'article' item (short summary)
    3. One 'fact' item
    4. One 'challenge' item
    5. One 'story' item (short narrative)

    Return a JSON array of objects fitting the 'FeedItem' interface. 
    Review these rules:
    - id: generate a unique string (e.g., 'item_<random>')
    - type: 'quiz' | 'article' | 'fact' | 'challenge' | 'story'
    - topic: which interest this relates to
    - title: catchy headline
    - xp_reward: 50-200
    - theme: 'purple-gradient' | 'blue-gradient' | 'green-gradient' | 'orange-gradient' | 'red-gradient'
    - likes: 0
    - likedByUser: false
    - shares: 0
    - comments: []
    - genie_reaction: 'cheer' | 'wink' | 'hint'
    
    SPECIFIC FIELDS BY TYPE:
    - quiz: question, options (4 strings), answer (string), correctIndex (0-3), explanation
    - article: summary, full_article_content (2-3 paragraphs), visualPrompt (for gradients/patterns)
    - fact: explanation, visualPrompt
    - challenge: question, answer, time_limit (seconds)
    - story: slides (array of {text: string}), visualPrompt
    
    IMPORTANT: Do NOT output markdown. Output ONLY valid JSON.
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

        // 2. Fetch relevant videos from YouTube for the first 2 interests
        const videoItems: FeedItem[] = [];
        if (interests.length > 0) {
            const query = `Learn ${interests[0]} educational`;
            const videos = await searchYouTubeVideos(query, 2);

            videos.forEach(v => {
                videoItems.push({
                    id: `vid_${v.id}`,
                    type: 'video',
                    topic: interests[0],
                    title: v.title,
                    xp_reward: 100,
                    genie_reaction: 'hype',
                    theme: 'red-gradient',
                    likedByUser: false,
                    likes: 0,
                    shares: 0,
                    comments: [],
                    // Video specific
                    script: v.description.substring(0, 100) + '...',
                    visualPrompt: 'video_thumbnail',
                    imageUrl: v.thumbnail,
                    video_url: `https://www.youtube.com/embed/${v.id}`
                } as any); // Type assertion to match FeedItem union
            });
        }

        // 3. Combine and Shuffle
        const finalFeed = [...videoItems, ...textItems].sort(() => Math.random() - 0.5);

        return NextResponse.json(finalFeed);

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}