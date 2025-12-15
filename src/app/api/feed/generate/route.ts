import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { FeedItem } from '@/types/feed';

// ============= CONFIGURATION =============
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

const GROQ_KEYS = [
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_7,
].filter(Boolean) as string[];

const getRandomGroqKey = () => GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)];

// ============= YOUTUBE SEARCH =============

async function searchYouTubeVideos(query: string, limit = 3): Promise<any[]> {
    // Disable YouTube search to conserve API quota
    // You can re-enable when quota resets (midnight Pacific Time)
    console.log('⚠️  YouTube search disabled - quota exceeded');
    return [];
    
    /* Uncomment when quota resets:
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
    */
}

// ============= GROQ GENERATION =============

async function generateFeedWithGroq(interests: string[], likedTopics: string[]): Promise<FeedItem[]> {
    const apiKey = getRandomGroqKey();
    if (!apiKey) {
        console.warn("No Groq API Keys available");
        return createFallbackFeed(interests);
    }

    const groq = new Groq({ apiKey });
    const focusTopics = [...new Set([...likedTopics, ...interests])].slice(0, 5);
    
    if (focusTopics.length === 0) {
        focusTopics.push('science', 'technology', 'history');
    }

    const prompt = `Create 7 educational feed items about: ${focusTopics.join(', ')}.

Return a JSON array with these exact structures:

QUIZ example:
{
  "id": "quiz_1",
  "type": "quiz",
  "topic": "${focusTopics[0]}",
  "title": "Test Your Knowledge",
  "question": "What is photosynthesis?",
  "options": [
    "Process plants use to make food from sunlight",
    "How animals digest food",
    "The water cycle in nature",
    "Rock formation process"
  ],
  "correctIndex": 0,
  "explanation": "Photosynthesis is how plants convert light energy into chemical energy.",
  "xp_reward": 100
}

ARTICLE example:
{
  "id": "article_1",
  "type": "article",
  "topic": "${focusTopics[1] || focusTopics[0]}",
  "title": "Understanding Quantum Physics",
  "summary": "A brief introduction to the fascinating world of quantum mechanics.",
  "full_article_content": "Quantum physics is the study of matter and energy at the smallest scales. At the quantum level, particles behave in ways that seem impossible in our everyday world. For example, a particle can be in two places at once, a phenomenon called superposition. Another strange quantum property is entanglement, where two particles can be connected across vast distances. These principles are the foundation of modern technology including computers, lasers, and MRI machines. Understanding quantum physics helps us grasp the fundamental nature of reality itself.",
  "xp_reward": 150
}

FACT example:
{
  "id": "fact_1",
  "type": "fact",
  "topic": "${focusTopics[2] || focusTopics[0]}",
  "title": "Amazing Discovery",
  "explanation": "The human brain contains approximately 86 billion neurons, each forming thousands of connections with other neurons. This creates a network more complex than any computer ever built. Your brain uses about 20% of your body's energy despite being only 2% of your body weight. Every time you learn something new, your brain physically changes by forming new neural pathways.",
  "xp_reward": 75
}

CHALLENGE example:
{
  "id": "challenge_1",
  "type": "challenge",
  "topic": "${focusTopics[3] || focusTopics[0]}",
  "title": "Solve This Problem",
  "question": "If you have a 5-liter jug and a 3-liter jug, how can you measure exactly 4 liters of water?",
  "answer": "1. Fill the 5L jug completely. 2. Pour from 5L into 3L jug (5L jug now has 2L). 3. Empty the 3L jug. 4. Pour the 2L from 5L jug into 3L jug. 5. Fill the 5L jug again. 6. Pour from 5L into 3L jug until 3L is full (this takes 1L). 7. The 5L jug now contains exactly 4L.",
  "time_limit": 120,
  "xp_reward": 200
}

STORY example:
{
  "id": "story_1",
  "type": "story",
  "topic": "${focusTopics[4] || focusTopics[0]}",
  "title": "Journey Through Time",
  "slides": [
    {"text": "In the year 2150, humanity discovered a way to travel through time."},
    {"text": "The first expedition went back to observe the construction of the pyramids."},
    {"text": "What they found changed our understanding of ancient civilizations forever."},
    {"text": "The ancient Egyptians had help from an unexpected source - future humans teaching them advanced mathematics."},
    {"text": "This created a time loop that ensured humanity's survival through the ages."}
  ],
  "xp_reward": 125
}

Generate 7 items with diverse types. Each item needs ALL required fields with real, educational content. Return ONLY the JSON array.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.8,
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
            const validTypes = ['quiz', 'article', 'fact', 'challenge', 'story'];
            const type = validTypes.includes(item.type) ? item.type : 'article';
            
            // Generate truly unique ID using timestamp + random + index
            const uniqueId = `${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}_${idx}`;
            
            const base: any = {
                id: uniqueId,
                type,
                topic: item.topic || focusTopics[idx % focusTopics.length] || 'general',
                title: item.title || `Learn about ${item.topic}`,
                xp_reward: item.xp_reward || 100,
                genie_reaction: 'wink',
                theme: 'purple-gradient',
                likedByUser: false,
                likes: Math.floor(Math.random() * 50),
                shares: Math.floor(Math.random() * 20),
                comments: [],
            };

            // Add type-specific fields with validation
            if (type === 'quiz') {
                base.question = item.question || 'Quiz question';
                base.options = Array.isArray(item.options) && item.options.length === 4 
                    ? item.options 
                    : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
                base.correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
                base.explanation = item.explanation || 'This is the correct answer.';
            } else if (type === 'article') {
                base.summary = item.summary || item.title || 'Article summary';
                base.full_article_content = item.full_article_content || item.summary || 'Article content not available.';
            } else if (type === 'fact') {
                base.explanation = item.explanation || 'Interesting fact.';
            } else if (type === 'challenge') {
                base.question = item.question || 'Challenge question';
                base.answer = item.answer || 'Challenge answer';
                base.time_limit = item.time_limit || 60;
            } else if (type === 'story') {
                // Stories: only text content, no background images
                base.slides = Array.isArray(item.slides) && item.slides.length > 0
                    ? item.slides.map((slide: any) => ({ 
                        text: slide.text || slide 
                        // Removed any image/visualPrompt/background fields
                      }))
                    : [{ text: item.title || 'Story content' }];
            }

            return base as FeedItem;
        });

        console.log(`✅ Groq generated ${normalized.length} items`);
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
            options: [
                'The fundamental principle',
                'An alternative theory',
                'A common misconception',
                'An outdated idea'
            ],
            correctIndex: 0,
            explanation: 'The fundamental principle is the most important concept to understand.',
            xp_reward: 100,
            genie_reaction: 'wink',
            theme: 'purple-gradient',
            likedByUser: false,
            likes: 10,
            shares: 2,
            comments: [],
        } as any,
        {
            id: `fallback_article_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'article',
            topic: topics[1] || topics[0],
            title: `Introduction to ${topics[1] || topics[0]}`,
            summary: `Learn the basics of ${topics[1] || topics[0]} in this comprehensive guide.`,
            full_article_content: `${topics[1] || topics[0]} is a fascinating subject that impacts our daily lives in many ways. Understanding its principles helps us make better decisions and appreciate the world around us. This article explores the key concepts and provides practical insights you can apply immediately. From historical context to modern applications, we'll cover everything you need to know to get started with ${topics[1] || topics[0]}.`,
            xp_reward: 150,
            genie_reaction: 'wink',
            theme: 'blue-gradient',
            likedByUser: false,
            likes: 25,
            shares: 5,
            comments: [],
        } as any,
        {
            id: `fallback_fact_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'fact',
            topic: topics[2] || topics[0],
            title: `Did You Know?`,
            explanation: `Here's an interesting fact about ${topics[2] || topics[0]}: It has been studied for centuries and continues to reveal new insights that shape our understanding of the world. Scientists and researchers are constantly making new discoveries that challenge what we thought we knew.`,
            xp_reward: 75,
            genie_reaction: 'wink',
            theme: 'green-gradient',
            likedByUser: false,
            likes: 15,
            shares: 3,
            comments: [],
        } as any,
    ];
}

// ============= MAIN HANDLER =============

export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { interests = [], likedTopics = [] } = body;

        console.log('🔄 Generating feed for:', interests.length, 'interests');

        // 1. Generate text content
        const textItems = await generateFeedWithGroq(interests, likedTopics);

        // 2. Add YouTube Shorts (max 3)
        const videoItems: FeedItem[] = [];
        if (interests.length > 0 && YOUTUBE_API_KEY) {
            const shorts = await searchYouTubeVideos(interests[0], 3);
            
            shorts.forEach((s, idx) => {
                if (!s?.id) return;
                
                videoItems.push({
                    id: `video_${s.id}_${idx}`,
                    type: 'video',
                    topic: interests[0],
                    title: s.title.length > 60 ? s.title.substring(0, 57) + '...' : s.title,
                    xp_reward: 75,
                    genie_reaction: 'cheer',
                    theme: 'orange-gradient',
                    likedByUser: false,
                    likes: Math.floor(Math.random() * 100) + 10,
                    shares: Math.floor(Math.random() * 20),
                    comments: [],
                    script: (s.description || 'Educational YouTube short').substring(0, 150),
                    visualPrompt: 'youtube_short',
                    imageUrl: s.thumbnail,
                    video_url: `https://www.youtube.com/embed/${s.id}`
                } as any);
            });
            
            console.log(`✅ Added ${videoItems.length} YouTube shorts`);
        } else if (!YOUTUBE_API_KEY) {
            console.warn('⚠️  YouTube API key not configured - skipping video search');
        }

        // 3. Combine and shuffle (take 10 items max)
        let finalFeed = [...textItems, ...videoItems]
            .slice(0, 10)
            .sort(() => Math.random() - 0.5);

        console.log(`✅ Final feed: ${finalFeed.length} items (${textItems.length} text, ${videoItems.length} videos)`);

        return NextResponse.json(finalFeed, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        });

    } catch (error: any) {
        console.error('❌ Feed Generation Failed:', error);
        
        // Return minimal fallback instead of error
        const fallback = createFallbackFeed(['science', 'technology']);
        return NextResponse.json(fallback);
    }
}