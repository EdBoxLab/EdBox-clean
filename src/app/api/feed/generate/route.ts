import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { FeedItem } from '@/types/feed';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============= CONFIGURATION =============
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

const GROQ_KEYS = [
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_12,
    process.env.GROQ_API_KEY_15,
    process.env.GROQ_API_KEY_7,
    process.env.GROQ_API_KEY_14,
    process.env.GROQ_API_KEY_18,
    process.env.GROQ_API_KEY_38,
    process.env.GROQ_API_KEY_28,
    process.env.GROQ_API_KEY_37,
].filter(Boolean) as string[];

const getRandomGroqKey = () => GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

// ============= YOUTUBE SEARCH =============

async function searchYouTubeVideos(query: string, limit = 3): Promise<any[]> {
    // Disable YouTube search to conserve API quota
    // You can re-enable when quota resets (midnight Pacific Time)
    console.log('⚠️  YouTube search disabled - quota exceeded');
    return [];


    if (!YOUTUBE_API_KEY) {
        console.warn("No YouTube API Key configured");
        return [];
    }

    try {
        const shortsQuery = `${query} #shorts educational`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(shortsQuery)}&type=video&maxResults=${limit}&videoDuration=short&key=${YOUTUBE_API_KEY}`;

        console.log('🔍 Searching YouTube:', shortsQuery);
        const response = await fetch(url);

        if (!response.ok) {
            console.error('YouTube API error:', response.status, await response.text());
            return [];
        }

        const data = await response.json();

        if (data.error) {
            console.error('YouTube API error:', data.error);
            return [];
        }

        if (!data.items || data.items.length === 0) {
            console.warn('No YouTube results found');
            return [];
        }

        const results: any[] = [];
        for (const item of data.items) {
            const videoId = item?.id?.videoId;
            if (!videoId) continue;

            results.push({
                id: videoId,
                title: item.snippet?.title || `YouTube short`,
                description: item.snippet?.description || '',
                thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || ''
            });
        }

        console.log(`✅ YouTube returned ${results.length} shorts`);
        return results;
    } catch (error) {
        console.error("YouTube Search Error:", error);
        return [];
    }

}

// ============= GROQ GENERATION =============

async function generateFeedWithGroq(interests: string[], likedTopics: string[], userCourses: string[] = []): Promise<FeedItem[]> {
    const apiKey = getRandomGroqKey();
    if (!apiKey) {
        console.warn("No Groq API Keys available");
        return createFallbackFeed(interests);
    }

    const groq = new Groq({ apiKey });

    // Mix course topics into focus
    const courseTopics = userCourses.slice(0, 3);
    const focusTopics = [...new Set([...likedTopics, ...interests, ...courseTopics])].slice(0, 8);

    if (focusTopics.length === 0) {
        focusTopics.push('science', 'technology', 'history');
    }

    const prompt = `Create exactly 7 highly engaging, educational feed items.
TARGET TOPICS: ${focusTopics.join(', ')}
USER'S ACTIVE COURSES: ${userCourses.join(', ')}

STRATEGIC INSTRUCTIONS:
1. PERSONALIZATION: Reference the user's courses explicitly and naturally.
2. HIGH QUALITY: Use deep insights, not generic facts. Avoid placeholders like "Option A".
3. DIVERSITY: Mix types: quiz, insight, poll, fact, story.
4. SCHEMA ADHERENCE: Follow these structures exactly.

QUIZ:
{
  "type": "quiz",
  "topic": "Specific Topic",
  "title": "Engaging Question Title",
  "question": "The actual question text?",
  "options": ["Specific Option 1", "Specific Option 2", "Specific Option 3", "Specific Option 4"],
  "correctIndex": 0,
  "explanation": "Why this is correct.",
  "xp_reward": 100
}

STORY:
{
  "type": "story",
  "topic": "Topic",
  "title": "Story Title",
  "slides": [{"text": "First part of the story..."}, {"text": "Conflict/Detail..."}, {"text": "Resolution/Insight..."}],
  "xp_reward": 150
}

[Also generate INSIGHT (summary, full_content), POLL (question, options[{id, text, votes}]), FACT (explanation), and STORY (slides)]

CRITICAL: Return ONLY a valid JSON array. No conversational text. No generic options. Return 'quiz' for questions, NEVER return 'challenge'.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.9, // Higher temp for more diversity
            max_tokens: 3000,
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (!raw) return createFallbackFeed(interests);

        // Extract JSON array
        let jsonStr = raw;
        const arrayMatch = raw.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            jsonStr = arrayMatch[0];
        }

        const parsed = JSON.parse(jsonStr);
        const items = Array.isArray(parsed) ? parsed : [];

        if (items.length === 0) return createFallbackFeed(interests);

        // Normalize items with guaranteed unique IDs
        const timestamp = Date.now();
        const normalized: FeedItem[] = items.map((item, idx) => {
            const validTypes = ['quiz', 'insight', 'fact', 'poll', 'story', 'article'];
            let type = item.type;

            // Map legacy/AI-hallucinated types to supported frontend types
            if (type === 'challenge') type = 'quiz';
            if (!validTypes.includes(type)) type = 'insight';

            const uniqueId = `${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}_${idx}`;

            const base: any = {
                id: uniqueId,
                type,
                topic: item.topic || focusTopics[idx % focusTopics.length] || 'general',
                title: item.title || `Learn about ${item.topic}`,
                xp_reward: item.xp_reward || 100,
                genie_reaction: ['wink', 'cheer', 'hype', 'hint'][idx % 4],
                theme: ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient'][idx % 4],
                likedByUser: false,
                likes: Math.floor(Math.random() * 500) + 50, // Higher likes for better aesthetics
                shares: Math.floor(Math.random() * 50),
                comments: [],
                courseReference: item.courseReference || null,
            };

            if (type === 'quiz') {
                base.question = item.question || item.content || 'Quiz question';
                base.options = Array.isArray(item.options) && item.options.length === 4
                    ? item.options
                    : ['True', 'False', 'Not enough info', 'Depends'];
                base.correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
                base.answer = base.options[base.correctIndex];
                base.explanation = item.explanation || item.summary || 'This is the correct answer.';
            } else if (type === 'poll') {
                base.question = item.question || 'What is your take on this?';
                base.options = Array.isArray(item.options) ? item.options : [
                    { id: 'opt_1', text: 'Yes', votes: 10 },
                    { id: 'opt_2', text: 'No', votes: 5 }
                ];
                base.total_votes = item.total_votes || base.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
            } else if (type === 'insight' || type === 'article') {
                base.type = 'insight';
                base.summary = item.summary || item.title || 'Insight summary';
                base.full_content = item.full_content || item.content || item.summary || 'Content not available.';
            } else if (type === 'fact') {
                base.explanation = item.explanation || item.fact || item.content || item.summary || 'Interesting fact content not available.';
            } else if (type === 'story') {
                const rawSlides = Array.isArray(item.slides) ? item.slides : (Array.isArray(item.content) ? item.content : []);
                base.slides = rawSlides.length > 0
                    ? rawSlides.map((slide: any) => ({
                        text: typeof slide === 'string' ? slide : (slide.text || slide.content || 'Slide content')
                    }))
                    : [{ text: item.summary || item.title || 'Story content' }];
            }

            return base as FeedItem;
        });

        console.log(`✅ Groq generated ${normalized.length} personalized items`);
        return normalized;

    } catch (error: any) {
        console.error('Groq Generation Error:', error?.message);
        return createFallbackFeed(interests);
    }
}

// ============= FALLBACK GENERATOR =============

function createFallbackFeed(interests: string[]): FeedItem[] {
    const topics = interests.length > 0 ? interests.slice(0, 3) : ['Quantum Physics', 'Modern History', 'Tech Innovation'];
    const timestamp = Date.now();

    return topics.map((topic, idx) => ({
        id: `fallback_${idx}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: idx % 2 === 0 ? 'quiz' : 'insight',
        topic,
        title: idx % 2 === 0 ? `Mastering ${topic}` : `The Hidden Power of ${topic}`,
        question: idx % 2 === 0 ? `Which of these best defines the core principle of ${topic}?` : undefined,
        options: idx % 2 === 0 ? ['The Fundamental Concept', 'The Second Derivative', 'Universal Constant', 'The Chaos Theory'] : undefined,
        correctIndex: idx % 2 === 0 ? 0 : undefined,
        answer: idx % 2 === 0 ? 'The Fundamental Concept' : undefined,
        explanation: `This is a key concept in ${topic} that many learners overlook. Exploring it further can unlock deeper understanding.`,
        summary: idx % 2 !== 0 ? `Why ${topic} is changing the way we see the world.` : undefined,
        full_content: idx % 2 !== 0 ? `In this insight, we explore the nuances of ${topic} and its practical applications in modern society. Understanding this connection is essential for mastery.` : undefined,
        xp_reward: 100,
        genie_reaction: ['wink', 'cheer'][idx % 2],
        theme: ['purple-gradient', 'blue-gradient', 'green-gradient'][idx % 3],
        likedByUser: false,
        likes: 420 + idx * 10,
        shares: 24,
        comments: [],
    } as any));
}

// ============= MAIN HANDLER =============

export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { interests = [], likedTopics = [], excludeTypes = [] } = body;

        // 0. Fetch user courses for personalization
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        let userCourses: string[] = [];

        if (user) {
            const { data: courses } = await supabase
                .from('skill_graphs')
                .select('goal')
                .eq('user_id', user.id)
                .limit(5);

            if (courses) {
                userCourses = courses.map(c => c.goal);
            }
        }

        console.log('🔄 Generating feed for user with', userCourses.length, 'courses');

        // 1. Generate text content
        const textItems = await generateFeedWithGroq(interests, likedTopics, userCourses);

        // 2. Add YouTube Shorts (max 3)
        const videoItems: FeedItem[] = [];
        if (interests.length > 0 && YOUTUBE_API_KEY) {
            const shorts = await searchYouTubeVideos(interests[0], 2);

            shorts.forEach((s, idx) => {
                if (!s?.id) return;
                videoItems.push({
                    id: `video_${s.id}_${idx}`,
                    type: 'video',
                    topic: interests[0],
                    title: s.title,
                    xp_reward: 75,
                    genie_reaction: 'cheer',
                    theme: 'orange-gradient',
                    likedByUser: false,
                    likes: Math.floor(Math.random() * 1000) + 100,
                    shares: Math.floor(Math.random() * 50),
                    comments: [],
                    script: s.description?.substring(0, 150),
                    visualPrompt: 'youtube_short',
                    imageUrl: s.thumbnail,
                    video_url: `https://www.youtube.com/embed/${s.id}`
                } as any);
            });
        }

        // 3. Combine and shuffle
        let finalFeed = [...textItems, ...videoItems]
            .filter(item => !excludeTypes.includes(item.type))
            .sort(() => Math.random() - 0.5);

        // Ensure we always have at least 7 items for a good UX, but max 10
        if (finalFeed.length < 7) {
            const extra = createFallbackFeed(interests).slice(0, 7 - finalFeed.length);
            finalFeed = [...finalFeed, ...extra];
        }

        return NextResponse.json(finalFeed.slice(0, 10));

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json(createFallbackFeed(['learning']));
    }
}
