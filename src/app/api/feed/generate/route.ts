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

async function searchYouTubeVideos(query: string, limit = 4): Promise<any[]> {
    if (!YOUTUBE_API_KEY) {
        console.warn("❌ No YouTube API Key configured; returning mock shorts for UI fallback");
        // Return mock shorts so UI still has video content when API key is missing
        return Array.from({ length: limit }).map((_, idx) => ({
            id: `mock_${idx}`,
            title: `${query} (sample short)`,
            description: `Sample short about ${query}`,
            thumbnail: `https://via.placeholder.com/480x360?text=Short+${idx+1}`
        }));
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
    const allTypes: string[] = ['quiz', 'article', 'fact', 'challenge', 'story'];
    const availableTypes = allTypes.filter(type => !excludeTypes.includes(type));
    
    // Generate 8 diverse types, ensuring no duplicates within this batch
    const selectedTypes: string[] = [];
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
    Generate 8 diverse, safe, educational feed items for a user interested in: ${focusTopics.join(', ')}.

    Requirements:
    - Return a single top-level JSON array of exactly 8 objects (no extra text).
    - Each object must include: id, type, topic, title, xp_reward, theme, likes, likedByUser, shares, comments (array), genie_reaction
    - Valid types: 'quiz','article','fact','challenge','story'. Ensure 'type' exactly matches one of these.

    Provide the simplest valid JSON possible. Example object for an 'article':
    {"id":"article_001","type":"article","topic":"${focusTopics[0] || 'general'}","title":"Short article","xp_reward":100,"theme":"blue-gradient","likes":5,"likedByUser":false,"shares":0,"comments":[],"summary":"1-2 sentence summary","full_article_content":"Paragraph 1. Paragraph 2.","visualPrompt":"background image prompt"}

    If you cannot comply, return an empty array []
    `;

    // Prefer configured model, fall back to supported defaults if decommissioned
    const preferredModel = process.env.GROQ_MODEL || 'meta-llama/llama-guard-4-12b';

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: preferredModel,
                temperature: 0.6,
                max_tokens: 1200,
                response_format: { type: 'json_object' }
            });

            const raw = completion.choices[0]?.message?.content;
            if (!raw) return [];

            // Try strict parse, then try to extract JSON bracketed substring if needed
            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch (parseErr) {
                // Attempt to extract first JSON array in the string
                const match = raw.match(/\[([\s\S]*?)\]/m);
                if (match) {
                    try {
                        parsed = JSON.parse(match[0]);
                    } catch (innerErr) {
                        parsed = null;
                    }
                }
            }

            const items = Array.isArray(parsed) ? parsed : (parsed?.items || parsed?.feed || []);

            // Validate and normalize items
            const allowedTypes = new Set(['quiz', 'article', 'fact', 'challenge', 'story']);
            const normalized: FeedItem[] = (items || []).map((it: any, idx: number) => {
                const type = allowedTypes.has(it.type) ? it.type : (selectedTypes[idx] || 'article');
                const topic = it.topic || focusTopics[idx % focusTopics.length] || 'general';

                // Provide minimal defaults for type-specific fields
                const options = Array.isArray(it.options) && it.options.length === 4 ? it.options : ['A', 'B', 'C', 'D'];
                const answer = it.answer || options[0];
                const correctIndex = typeof it.correctIndex === 'number' ? it.correctIndex : options.indexOf(answer);
                const summary = it.summary || (typeof it.full_article_content === 'string' ? it.full_article_content.split('. ')[0] : undefined) || `Short summary about ${topic}.`;

                const base: FeedItem = {
                    id: it.id || `${type}_${Date.now()}_${idx}`,
                    type: type as any,
                    topic,
                    title: it.title || `${type} about ${topic}`,
                    xp_reward: typeof it.xp_reward === 'number' ? it.xp_reward : 100,
                    genie_reaction: it.genie_reaction || 'wink',
                    theme: it.theme || 'purple-gradient',
                    likedByUser: !!it.likedByUser,
                    likes: typeof it.likes === 'number' ? it.likes : 0,
                    shares: typeof it.shares === 'number' ? it.shares : 0,
                    comments: Array.isArray(it.comments) ? it.comments : [],
                } as FeedItem;

                // Attach type-specific normalized fields
                if (type === 'article') {
                    (base as any).summary = summary;
                    (base as any).full_article_content = it.full_article_content || `${summary} (more content not available)`;
                }

                if (type === 'fact') {
                    (base as any).explanation = it.explanation || `A concise explanation about ${topic}.`;
                }

                if (type === 'quiz') {
                    (base as any).question = it.question || `Quick ${topic} question`;
                    (base as any).options = options;
                    (base as any).answer = answer;
                    (base as any).correctIndex = typeof correctIndex === 'number' && correctIndex >= 0 ? correctIndex : 0;
                    (base as any).explanation = it.explanation || 'Explanation not provided.';
                }

                if (type === 'challenge') {
                    (base as any).question = it.question || `Challenge: ${topic}`;
                    (base as any).answer = it.answer || 'Solution not provided.';
                    (base as any).time_limit = typeof it.time_limit === 'number' ? it.time_limit : 60;
                }

                if (type === 'story') {
                    (base as any).slides = Array.isArray(it.slides) && it.slides.length > 0 ? it.slides : [{ text: summary }];
                }

                // Template hint for frontend
                (base as any).template = `${type}-template`;

                return base;
            });

            // If normalized is empty, fall through to fallback generation
            if (normalized.length > 0) return normalized;

        } catch (err: any) {
            // If model was decommissioned, retry with a safe fallback
            const isModelDecommissioned = err?.message?.includes('decommissioned') || err?.error?.code === 'model_decommissioned';
            if (isModelDecommissioned) {
                console.warn('Groq model decommissioned; retrying with fallback model llama-3.1-8b-instant');
                try {
                    const completion = await groq.chat.completions.create({
                        messages: [{ role: 'user', content: prompt }],
                        model: 'llama-3.1-8b-instant',
                        temperature: 0.6,
                        max_tokens: 1200,
                        response_format: { type: 'json_object' }
                    });

                    const raw = completion.choices[0]?.message?.content;
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            const items = Array.isArray(parsed) ? parsed : (parsed?.items || parsed?.feed || []);
                            if (items && items.length) return items;
                        } catch (e) {
                            // ignore and fall through
                        }
                    }
                } catch (fallbackErr) {
                    console.error('Groq fallback model also failed:', fallbackErr);
                }
            }

            console.error('Groq Gen Error:', err);
        }

        // Final fallback: deterministic generation when Groq fails to produce valid items
        console.warn('Falling back to deterministic generator using interests');
        const fallbackTypes: string[] = ['quiz', 'article', 'fact', 'challenge', 'story'];
        const generated: FeedItem[] = [];
        for (let i = 0; i < 8; i++) {
            const type = fallbackTypes[i % fallbackTypes.length];
            const topic = interests[i % Math.max(1, interests.length)] || 'general';
            generated.push({
                id: `det_${type}_${i}`,
                type: type as any,
                topic,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)}: Quick ${topic} insight #${i + 1}`,
                xp_reward: 50 + (i * 5),
                genie_reaction: 'wink' as any,
                theme: 'purple-gradient' as any,
                likedByUser: false,
                likes: 0,
                shares: 0,
                comments: [],
                // Type-specific shallow fields
                summary: type === 'article' ? `Short summary about ${topic}.` : undefined,
                explanation: type === 'fact' ? `A concise explanation about ${topic}.` : undefined,
                question: type === 'quiz' || type === 'challenge' ? `Solve this ${topic} problem.` : undefined,
                slides: type === 'story' ? [{ text: `A quick slide about ${topic}.` }] : undefined,
            } as any);
        }

        return generated;
    }

// ============= MAIN HANDLER =============

export const POST = async (request: NextRequest) => {
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
            const shorts = await searchYouTubeVideos(shortsQuery, 4); // Get up to 4 shorts to include in feed
            
            // Deduplicate and include valid results
            const seenShorts = new Set<string>();
            shorts.forEach((s) => {
                if (!s || !s.id || seenShorts.has(s.id)) return;
                seenShorts.add(s.id);
                videoItems.push({
                    id: `short_${s.id}`,
                    type: 'video',
                    topic: interests[0] || 'general',
                    title: `${s.title.length > 60 ? s.title.substring(0, 57) + '...' : s.title}`,
                    xp_reward: 75,
                    genie_reaction: 'cheer',
                    theme: 'orange-gradient',
                    likedByUser: false,
                    likes: Math.floor(Math.random() * 200),
                    shares: Math.floor(Math.random() * 50),
                    comments: [],
                    script: (s.description || '').substring(0, 150) + '...',
                    visualPrompt: 'short_form_content',
                    imageUrl: s.thumbnail,
                    video_url: `https://www.youtube.com/embed/${s.id}`
                } as any);
            });
        }

        // 3. Combine to make exactly 10 items and shuffle for variety
        let finalFeed = [...textItems, ...videoItems].slice(0, 10).sort(() => Math.random() - 0.5);

        // If generation failed and no videos found, return small fallback content to avoid repeated reloads
        if (finalFeed.length === 0) {
            console.warn('Feed generation returned no items; returning fallback content');
            const fallback = (interests.length ? interests : ['general']).slice(0, 3).map((t: string, i: number) => ({
                id: `fallback_${i}`,
                type: 'article',
                topic: t,
                title: `Quick fact about ${t}`,
                xp_reward: 50,
                genie_reaction: 'wink',
                theme: 'blue-gradient',
                likedByUser: false,
                likes: 0,
                shares: 0,
                comments: [],
                summary: `A short, fallback fact about ${t}.`,
                full_article_content: `Fallback content for ${t}. This is placeholder text.`
            } as any));

            finalFeed = fallback;
        }

        return NextResponse.json(finalFeed);

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}