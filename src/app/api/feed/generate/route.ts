import { NextRequest, NextResponse } from 'next/server';
import { FeedItem } from '@/types/feed';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { getUnsplashImageUrl } from '@/lib/utils/unsplash';

interface UserContext {
    courses: string[];
    studyKits: { title: string; topics: string[] }[];
    interests: string[];
    learningStyle: string;
    country?: string;
}

async function generateMadFeed(
    userContext: UserContext,
    seenTitles: string[]
): Promise<FeedItem[]> {
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(2, 10);

    const coursesList = userContext.courses.filter(Boolean);
    const studyKitTitles = userContext.studyKits.map(sk => sk.title).filter(Boolean);
    const studyKitTopics = userContext.studyKits.flatMap(sk => sk.topics).filter(Boolean);
    const interestsList = userContext.interests.filter(Boolean);

    const allTopics = [
        ...coursesList,
        ...studyKitTitles,
        ...studyKitTopics,
        ...interestsList
    ].filter(Boolean);

    const contextSeeds = allTopics.length > 0 ? allTopics : [
        'Quantum Computing', 'sports', 'music', 'Behavioral Economics', 'Neuroscience',
        'Space Exploration', 'psychology', 'Cryptography', 'Philosophy of Mind'
    ];

    const blacklist = seenTitles.slice(-100).join(' | ');
    const primaryTopic = contextSeeds[Math.floor(Math.random() * contextSeeds.length)];
    const uniqueTopics = [...new Set(allTopics)].slice(0, 15).join(', ');

    const studyKitInfo = userContext.studyKits.length > 0
        ? `\nUSER'S STUDY KITS: ${userContext.studyKits.map(sk => `${sk.title} (${sk.topics.join(', ')})`).join('; ')}`
        : '';

    const preferencesInfo = userContext.interests.length > 0
        ? `\nUSER INTERESTS: ${userContext.interests.join(', ')}`
        : '';

    const learningStyleInfo = userContext.learningStyle
        ? `\nLEARNING STYLE: ${userContext.learningStyle} - tailor content accordingly`
        : '';

    const countryInfo = userContext.country
        ? `\nUSER COUNTRY: ${userContext.country} - include relevant cultural/regional context when appropriate`
        : '';

    const systemPrompt = `You are the LEAD ALGORITHM DESIGNER for the world's most addictive educational app. Your mission: create content that triggers "intellectual dopamine" - the same neurological reward loop as TikTok/Instagram but for learning.

CURRENT USER CONTEXT:
- Courses/Goals: ${coursesList.length > 0 ? coursesList.join(', ') : 'None specified'}
- Study Kits: ${studyKitTitles.length > 0 ? studyKitTitles.join(', ') : 'None'}
- Study Kit Topics: ${studyKitTopics.length > 0 ? studyKitTopics.slice(0, 10).join(', ') : 'None'}
- User Interests: ${interestsList.length > 0 ? interestsList.join(', ') : 'General'}
- Learning Style: ${userContext.learningStyle || 'visual'}
- Country: ${userContext.country || 'Not specified'}
- Primary Focus for this batch: ${primaryTopic}
- Session Seed: ${randomSeed} (USE THIS FOR RANDOMIZATION)

BLACKLISTED CONTENT (ABSOLUTELY NEVER GENERATE THESE):
${blacklist || 'None yet'}

ENGAGEMENT PRINCIPLES (TikTok Algorithm Secrets Applied to Learning):
1. THE HOOK (First 3 words must create an "open loop" the brain NEEDS to close)
2. VISUAL STIMULATION (Every item MUST have compelling image keywords for Unsplash)
3. PATTERN INTERRUPT (Every piece should subvert expectations)
4. VARIABLE REWARD (Mix difficulty, format, and topic unpredictably)
5. KNOWLEDGE GAP (Create urgency by revealing they don't know something important)

CONTENT MIX (Generate EXACTLY 8 items with this distribution):
- 2x "media": Visual-first content with headline + body text + Unsplash keywords
- 2x "Mind-Bender" (fact): Counter-intuitive facts that break mental models
- 1x "Deep Dive" (insight): Advanced applications that feel like insider secrets  
- 1x "Challenge": Problems that make them feel smart when solved
- 1x "Quiz": Multiple choice to test understanding
- 1x "Debate": Controversial takes with no clear answer

CRITICAL: For image_keywords, provide 2-3 simple, concrete English words that will work on Unsplash.
Good: "brain, neurons, science" or "mathematics, abstract, patterns" or "technology, future, digital"
Bad: "quantum superposition visualization" or "abstract concept"

OUTPUT FORMAT: Return a JSON object with an "items" key containing exactly 8 objects. Each object MUST have:
- "type": one of ["media", "fact", "insight", "challenge", "quiz", "debate"]
- "topic": the learning area
- "title": THE HOOK (max 10 words, curiosity-driven)
- "image_keywords": 2-3 simple concrete Unsplash keywords (e.g., "space, stars, galaxy")

Plus type-specific fields:
- media: { "headline": "bold statement", "body": "2-3 sentence explanation", "source": "optional attribution" }
- fact: { "explanation": "the mind-bending content" }
- insight: { "summary": "1-line hook", "full_content": "the deep insight (2-3 paragraphs)" }
- challenge: { "question": "the problem", "hint": "subtle nudge", "answer": "elegant solution" }
- quiz: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "why" }
- debate: { "viewpoint_a": "position 1", "viewpoint_b": "position 2", "question": "the dilemma" }`;

    const prompt = `Generate 8 pieces of viral educational content personalized for this user.

USER PROFILE:
- Courses/Goals: ${coursesList.length > 0 ? coursesList.join(', ') : 'General learning'}
- Study Kits: ${studyKitTitles.length > 0 ? studyKitTitles.join(', ') : 'None'}
- Study Kit Topics: ${studyKitTopics.length > 0 ? studyKitTopics.slice(0, 10).join(', ') : 'None'}
- Interests: ${interestsList.length > 0 ? interestsList.join(', ') : 'General'}
- Learning Style: ${userContext.learningStyle || 'visual'}
- Country: ${userContext.country || 'Global'}

CRITICAL: 
1. Use session seed "${randomSeed}" to ensure completely unique angles
2. Never repeat topics from blacklist
3. Include simple, concrete "image_keywords" for each item (2-3 words that work on image searches)
4. GENERATE CONTENT RELEVANT TO THE USER'S COURSES, STUDY KITS, AND INTERESTS ABOVE
5. If user has study kits or courses, at least 5 items should be directly related to those topics

Return a JSON object with an "items" array.`;

    try {
        console.log(`🧠  ALGO: Generating with seed ${randomSeed}`);
        console.log(`📚 Full Context - Courses: ${coursesList.length}, Study Kits: ${studyKitTitles.length}, Topics: ${studyKitTopics.length}, Interests: ${interestsList.length}, Country: ${userContext.country || 'N/A'}`);
        console.log(`📋 Courses: ${coursesList.slice(0, 5).join(', ')}`);
        console.log(`📋 Study Kits: ${studyKitTitles.slice(0, 5).join(', ')}`);
        console.log(`📋 Interests: ${interestsList.slice(0, 5).join(', ')}`);

        const result = await generateWithRetry({
            prompt,
            systemPrompt,
            temperature: 1.1,
            maxTokens: 5000,
            schema: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["type", "topic", "title", "image_keywords"],
                            properties: {
                                type: { type: "string", enum: ["media", "quiz", "insight", "fact", "story", "challenge", "debate"] },
                                topic: { type: "string" },
                                title: { type: "string" },
                                image_keywords: { type: "string" },
                                headline: { type: "string" },
                                body: { type: "string" },
                                source: { type: "string" },
                                question: { type: "string" },
                                options: { type: "array", items: { type: "string" } },
                                correctIndex: { type: "number" },
                                explanation: { type: "string" },
                                summary: { type: "string" },
                                full_content: { type: "string" },
                                slides: { type: "array", items: { type: "object", properties: { text: { type: "string" } } } },
                                hint: { type: "string" },
                                answer: { type: "string" },
                                viewpoint_a: { type: "string" },
                                viewpoint_b: { type: "string" }
                            }
                        }
                    }
                },
                required: ["items"]
            }
        });

        if (!result.success || !result.text) {
            console.error(`❌ AI returned no text. Provider: ${result.provider}`);
            throw new Error('AI generation returned empty response');
        }

        console.log(`✅ AI Response received from ${result.provider}`);

        let parsed;
        try {
            const cleanText = result.text.trim().replace(/^```json/, '').replace(/```$/, '').trim();
            parsed = JSON.parse(cleanText);
        } catch (e) {
            console.error("❌ JSON parse failed, attempting extraction...");
            const match = result.text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    parsed = JSON.parse(match[0]);
                } catch (e2) {
                    const arrayMatch = result.text.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                        parsed = { items: JSON.parse(arrayMatch[0]) };
                    } else {
                        throw new Error('Could not extract JSON from AI response');
                    }
                }
            } else {
                throw new Error('Could not extract JSON from AI response');
            }
        }

        let items = [];
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
            items = parsed.items;
        } else if (parsed && typeof parsed === 'object') {
            const arrays = Object.values(parsed).find(v => Array.isArray(v));
            if (arrays) items = arrays as any[];
        }

        if (items.length === 0) {
            console.error("❌ Parsed object:", JSON.stringify(parsed).substring(0, 500));
            throw new Error('AI returned empty array or invalid structure');
        }

        console.log(`✅ Parsed ${items.length} feed items`);

        return items.map((item: any, idx: number) => {
            const type = item.type || 'insight';
            const title = item.title || `${item.topic} Discovery`;
            const uniqueId = `mad_${randomSeed}_${timestamp}_${idx}`;

            const imageKeywords = item.image_keywords || item.visual_prompt || item.topic || 'education';
            const imageUrl = getUnsplashImageUrl(imageKeywords);

            const base: any = {
                id: uniqueId,
                type,
                topic: item.topic || contextSeeds[idx % contextSeeds.length],
                title,
                visualPrompt: imageKeywords,
                imageKeywords: imageKeywords,
                imageUrl: imageUrl,
                imageGenerationState: 'ready',
                xp_reward: 100 + Math.floor(Math.random() * 100),
                genie_reaction: ['wink', 'cheer', 'hype', 'hint', 'shock', 'fire'][idx % 6],
                theme: ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient', 'red-gradient', 'cyan-gradient', 'rose-gradient'][idx % 7],
                likedByUser: false,
                likes: Math.floor(Math.random() * 10000) + 500,
                shares: Math.floor(Math.random() * 1000),
                comments: [],
            };

            if (type === 'media') {
                base.headline = item.headline || title;
                base.body = item.body || item.explanation || 'Explore this fascinating topic with Genie.';
                base.source = item.source || null;
            } else if (type === 'quiz') {
                base.question = item.question || 'Test your understanding';
                base.options = Array.isArray(item.options) && item.options.length >= 2 ? item.options : ['Option A', 'Option B', 'Option C', 'Option D'];
                base.correctIndex = typeof item.correctIndex === 'number' ? item.correctIndex : 0;
                base.answer = base.options[base.correctIndex];
                base.explanation = item.explanation || 'Great reasoning!';
            } else if (type === 'insight') {
                base.summary = item.summary || title;
                base.full_content = item.full_content || item.summary || 'Dive deeper with Genie.';
            } else if (type === 'fact') {
                base.explanation = item.explanation || 'A fascinating truth awaits.';
            } else if (type === 'story') {
                base.slides = Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [{ text: title }];
            } else if (type === 'challenge') {
                base.question = item.question || 'Solve this puzzle';
                base.hint = item.hint || 'Think creatively.';
                base.answer = item.answer || 'Ask Genie for help!';
            } else if (type === 'debate') {
                base.viewpoint_a = item.viewpoint_a || 'One perspective...';
                base.viewpoint_b = item.viewpoint_b || 'Another perspective...';
                base.question = item.question || 'Where do you stand?';
            }

            return base as FeedItem;
        });

    } catch (error: any) {
        console.error('❌  ALGO FAILED:', error.message);
        throw error;
    }
}

export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { seenTitles = [] } = body;

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        const userContext: UserContext = {
            courses: [],
            studyKits: [],
            interests: [],
            learningStyle: 'visual',
            country: undefined
        };

        if (user) {
            const [coursesRes, studyKitsRes, profileRes, preferencesRes] = await Promise.all([
                supabase.from('skill_graphs').select('goal').eq('user_id', user.id).limit(10),
                supabase.from('study_kit_content').select('title, source_content, generated_content').eq('user_id', user.id).limit(10),
                supabase.from('profiles').select('interests, goal, country').eq('id', user.id).single(),
                supabase.from('user_preferences').select('interests, learning_style').eq('id', user.id).single()
            ]);

            if (coursesRes.data) {
                userContext.courses = coursesRes.data.map(c => c.goal).filter(Boolean);
            }

            if (studyKitsRes.data) {
                userContext.studyKits = studyKitsRes.data.map(kit => {
                    const topics: string[] = [];
                    if (kit.generated_content && typeof kit.generated_content === 'object') {
                        const gc = kit.generated_content as any;
                        if (gc.keyTopics) topics.push(...gc.keyTopics.slice(0, 5));
                        if (gc.concepts) topics.push(...gc.concepts.slice(0, 3));
                    }
                    return {
                        title: kit.title || 'Untitled Kit',
                        topics
                    };
                }).filter(sk => sk.title);
            }

            // Merge profile and preferences
            const profile = profileRes.data;
            const prefs = preferencesRes.data;

            if (profile) {
                userContext.interests = [...new Set([...(profile.interests || []), ...(prefs?.interests || [])])];
                userContext.country = profile.country;
                if (profile.goal && !userContext.courses.includes(profile.goal)) {
                    userContext.courses.push(profile.goal);
                }
            } else if (prefs) {
                userContext.interests = prefs.interests || [];
            }

            if (prefs) {
                userContext.learningStyle = prefs.learning_style || 'visual';
            }
        }

        console.log(`🔥  FEED REQUEST: ${userContext.courses.length} courses, ${userContext.studyKits.length} study kits, ${userContext.interests.length} interests, ${seenTitles.length} blacklisted titles`);

        const feedItems = await generateMadFeed(userContext, seenTitles);

        const uniqueItems = feedItems.filter(item => {
            const titleLower = item.title.toLowerCase();
            return !seenTitles.some((seen: string) => seen.toLowerCase() === titleLower);
        });

        console.log(`✅ Returning ${uniqueItems.length} unique items`);

        // Persist to history table for deep linking support
        if (uniqueItems.length > 0) {
            const historyItems = uniqueItems.map(item => ({
                id: item.id,
                type: item.type,
                topic: item.topic,
                title: item.title,
                content: item
            }));
            
            try {
                const { error } = await supabase.from('feed_items_history').insert(historyItems);
                if (error) {
                    console.error('Failed to persist feed items to history:', error);
                }
            } catch (err) {
                console.error('Exception while persisting feed items to history:', err);
            }
        }

        return NextResponse.json(uniqueItems);

    } catch (error: any) {
        console.error('❌ FEED GENERATION CRITICAL FAILURE:', error.message);

        return NextResponse.json({
            error: 'Feed generation failed',
            message: error.message
        }, { status: 500 });
    }
}
