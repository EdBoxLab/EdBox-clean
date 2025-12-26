import { NextRequest, NextResponse } from 'next/server';
import { FeedItem } from '@/types/feed';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

async function generateMadFeed(
    userCourses: string[],
    studyKitContext: string[],
    seenTitles: string[]
): Promise<FeedItem[]> {
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(2, 10);

    const contextSeeds = [...userCourses, ...studyKitContext].filter(Boolean);

    if (contextSeeds.length === 0) {
        contextSeeds.push(
            'Quantum Computing', 'sports', 'music', 'Behavioral Economics', 'Neuroscience',
            'Space Exploration', 'psychology', 'Cryptography', 'Philosophy of Mind'
        );
    }

    const blacklist = seenTitles.slice(-100).join(' | ');
    const primaryTopic = contextSeeds[Math.floor(Math.random() * contextSeeds.length)];
    const secondaryTopics = contextSeeds.slice(0, 5).join(', ');

    const systemPrompt = `You are the LEAD ALGORITHM DESIGNER for the world's most addictive educational app. Your mission: create content that triggers "intellectual dopamine" - the same neurological reward loop as TikTok/Instagram but for learning.

CURRENT USER CONTEXT:
- Primary Learning Focus: ${primaryTopic}
- All Learning Areas: ${secondaryTopics}
- Session Seed: ${randomSeed} (USE THIS FOR RANDOMIZATION)

BLACKLISTED CONTENT (ABSOLUTELY NEVER GENERATE THESE):
${blacklist || 'None yet'}

ENGAGEMENT PRINCIPLES (TikTok Algorithm Secrets Applied to Learning):
1. THE HOOK (First 3 words must create an "open loop" the brain NEEDS to close)
2. PATTERN INTERRUPT (Every piece should subvert expectations)
3. VARIABLE REWARD (Mix difficulty, format, and topic unpredictably)
4. IDENTITY REINFORCEMENT ("You're the type of person who...")
5. KNOWLEDGE GAP (Create urgency by revealing they don't know something important)

CONTENT MIX (Generate EXACTLY 8 items with this distribution):
- 2x "Mind-Bender": Counter-intuitive facts that break mental models
- 2x "Deep Dive": Advanced applications of their courses that feel like insider secrets
- 2x "Challenge": Problems that make them feel smart when solved
- 1x "Debate": Controversial takes with no clear answer
- 1x "Story": Narrative-driven micro-learning (3 slides max)

QUALITY RULES:
- NO definitions, NO introductions, NO "Did you know..."
- Every title MUST create curiosity tension
- Content should make them want to screenshot and share
- Difficulty: Assume they're intelligent but make them work for insights

OUTPUT FORMAT: Return a JSON object with an "items" key containing exactly 8 objects. Each object MUST have:
- "type": one of ["fact", "insight", "challenge", "debate", "story", "quiz"]
- "topic": the learning area
- "title": THE HOOK (max 10 words, curiosity-driven)

Plus type-specific fields:
- fact: { "explanation": "the mind-bending content" }
- insight: { "summary": "1-line hook", "full_content": "the deep insight (2-3 paragraphs)" }
- challenge: { "question": "the problem", "hint": "subtle nudge", "answer": "elegant solution" }
- debate: { "viewpoint_a": "position 1", "viewpoint_b": "position 2", "question": "the dilemma" }
- story: { "slides": [{ "text": "slide 1" }, { "text": "slide 2" }, { "text": "slide 3" }] }
- quiz: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "why" }`;

    const prompt = `Generate 8 pieces of viral educational content for someone studying: ${secondaryTopics}.

CRITICAL: Use session seed "${randomSeed}" to ensure completely unique angles. Never repeat topics from blacklist.

Make every piece feel like an exclusive insight they can't get anywhere else. Return a JSON object with an "items" array.`;

    try {
        console.log(`🧠 MAD ALGO: Generating for [${secondaryTopics}] with seed ${randomSeed}`);

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
                            required: ["type", "topic", "title"],
                            properties: {
                                type: { type: "string", enum: ["quiz", "insight", "fact", "story", "challenge", "debate"] },
                                topic: { type: "string" },
                                title: { type: "string" },
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
            // Try to find ANY array in the object
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

            const base: any = {
                id: uniqueId,
                type,
                topic: item.topic || contextSeeds[idx % contextSeeds.length],
                title,
                xp_reward: 100 + Math.floor(Math.random() * 100),
                genie_reaction: ['wink', 'cheer', 'hype', 'hint', 'shock', 'fire'][idx % 6],
                theme: ['purple-gradient', 'blue-gradient', 'green-gradient', 'orange-gradient', 'red-gradient', 'cyan-gradient', 'rose-gradient'][idx % 7],
                likedByUser: false,
                likes: Math.floor(Math.random() * 10000) + 500,
                shares: Math.floor(Math.random() * 1000),
                comments: [],
            };

            if (type === 'quiz') {
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
        console.error('❌ MAD ALGO FAILED:', error.message);
        throw error;
    }
}

export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { seenTitles = [] } = body;

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        let userCourses: string[] = [];
        let studyKitContext: string[] = [];

        if (user) {
            const [coursesRes, studyKitsRes] = await Promise.all([
                supabase.from('skill_graphs').select('goal').eq('user_id', user.id).limit(10),
                supabase.from('study_kit_content').select('title, source_content, generated_content').eq('user_id', user.id).limit(10)
            ]);

            if (coursesRes.data) {
                userCourses = coursesRes.data.map(c => c.goal).filter(Boolean);
            }

            if (studyKitsRes.data) {
                studyKitContext = studyKitsRes.data.map(kit => {
                    let context = kit.title || '';
                    if (kit.generated_content && typeof kit.generated_content === 'object') {
                        const gc = kit.generated_content as any;
                        if (gc.summary) context += ` - ${gc.summary}`;
                        if (gc.keyTopics) context += ` (${gc.keyTopics.slice(0, 3).join(', ')})`;
                    }
                    return context;
                }).filter(Boolean);
            }
        }

        console.log(`🔥 MAD FEED REQUEST: ${userCourses.length} courses, ${studyKitContext.length} study kits, ${seenTitles.length} blacklisted titles`);

        const feedItems = await generateMadFeed(userCourses, studyKitContext, seenTitles);

        const uniqueItems = feedItems.filter(item => {
            const titleLower = item.title.toLowerCase();
            return !seenTitles.some((seen: string) => seen.toLowerCase() === titleLower);
        });

        console.log(`✅ Returning ${uniqueItems.length} unique items`);

        return NextResponse.json(uniqueItems);

    } catch (error: any) {
        console.error('❌ FEED GENERATION CRITICAL FAILURE:', error.message);

        return NextResponse.json({
            error: 'Feed generation failed',
            message: error.message
        }, { status: 500 });
    }
}
