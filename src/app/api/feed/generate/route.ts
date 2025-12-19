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

    const prompt = `Create 7 *high-impact, * feed items  that makes the user smarter with every scroll.
TARGET TOPICS: ${focusTopics.join(', ')}
USER'S ACTIVE COURSES: ${userCourses.join(', ')}

STRATEGIC INSTRUCTIONS:
1. PERSONALIZATION: Reference the user's courses explicitly in 3 items. Example: "Since you're mastering [Course Name], here's a deep cut..."
2. RADICAL DIVERSITY: Vary personas (Genius Genie, Skeptic Researcher, Future Historian). Vary formats (surprising facts, hard challenges, interactive stories, controversial insights).
3. THE "HOOK": Use click-worthy, question-based titles. Focus on "Mind-blowing" or "Hidden" knowledge.
4. NO REPETITION: Every item must feel distinct. Avoid 7 similar "How-to" insights.
5. COURSE LINKING: For items referencing a course, add a "courseReference" field with the EXACT course name.

Return a JSON array with these exact structures:

QUIZ example:
{
  "id": "quiz_1",
  "type": "quiz",
  "topic": "Topic Name",
  "title": "Wait, You Didn't Know This?",
  "question": "Which of these actually [Surprising Fact]?",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "explanation": "Brief, punchy explanation.",
  "xp_reward": 100,
  "courseReference": "[Optional Course Name]"
}

INSIGHT example:
{
  "id": "insight_1",
  "type": "insight",
  "topic": "Topic Name",
  "title": "The Lie They Told You About [Topic]",
  "summary": "Everything you know about X is slightly wrong.",
  "full_content": "Deep, engaging detail that hooks the reader...",
  "xp_reward": 150,
  "courseReference": "[Optional Course Name]"
}

[Also generate POLL, FACT, and STORY with similar high-engagement styles and optional courseReference]

POLL example:
{
  "id": "poll_1",
  "type": "poll",
  "topic": "Topic Name",
  "title": "Genie's Pulse Check",
  "question": "Which of these [Controversial/Interesting Topic] do you agree with most?",
  "options": [
    {"id": "opt_1", "text": "Option A", "votes": 45},
    {"id": "opt_2", "text": "Option B", "votes": 30},
    {"id": "opt_3", "text": "Option C", "votes": 25}
  ],
  "total_votes": 100,
  "courseReference": "[Optional Course Name]"
}

Return ONLY the JSON array.`;

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
            const validTypes = ['quiz', 'insight', 'fact', 'challenge', 'story', 'article'];
            const type = validTypes.includes(item.type) ? item.type : 'insight';

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
                base.question = item.question || 'Quiz question';
                base.options = Array.isArray(item.options) && item.options.length === 4
                    ? item.options
                    : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
                base.correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
                base.explanation = item.explanation || 'This is the correct answer.';
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
                base.full_content = item.full_content || item.summary || 'Content not available.';
            } else if (type === 'fact') {
                base.explanation = item.explanation || 'Interesting fact.';
            } else if (type === 'challenge') {
                base.question = item.question || 'Challenge question';
                base.answer = item.answer || 'Challenge answer';
                base.time_limit = item.time_limit || 60;
            } else if (type === 'story') {
                base.slides = Array.isArray(item.slides) && item.slides.length > 0
                    ? item.slides.map((slide: any) => ({
                        text: slide.text || slide
                    }))
                    : [{ text: item.title || 'Story content' }];
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
    const topics = interests.length > 0 ? interests.slice(0, 3) : ['science', 'technology', 'history'];
    const timestamp = Date.now();

    return [
        {
            id: `fallback_quiz_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'quiz',
            topic: topics[0],
            title: `Quick ${topics[0]} Quiz`,
            question: `What is an important concept in ${topics[0]}?`,
            options: ['Principle A', 'Principle B', 'Principle C', 'Principle D'],
            correctIndex: 0,
            explanation: 'Brief explanation.',
            xp_reward: 100,
            genie_reaction: 'wink',
            theme: 'purple-gradient',
            likedByUser: false,
            likes: 120,
            shares: 12,
            comments: [],
        } as any,
    ];
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
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

        return NextResponse.json(finalFeed);

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        return NextResponse.json(createFallbackFeed(['learning']));
    }
}
