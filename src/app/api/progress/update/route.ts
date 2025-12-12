import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

function extractJSON(text: string) {
    try {
        const fenced = text.match(/```json([\s\S]*?)```/i);
        const raw = fenced ? fenced[1] : text;
        return JSON.parse(
            raw
                .replace(/[\n\r]+/g, '')
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']')
        );
    } catch {
        return text;
    }
}

function buildPrompt(type: ContentType, skillName: string, skillDescription: string) {
    const base = `Create study materials for mastered skill:\nSkill: ${skillName}\nDescription: ${skillDescription}\n\n`;
    switch (type) {
        case 'quizzes':
            return base + 'Generate EXACTLY 5 MCQ questions as strict JSON array with format: [{question, options: [string], correctAnswer: number}].';
        case 'flashcards':
            return base + 'Generate EXACTLY 10 flashcards as strict JSON array with format: [{front, back}].';
        case 'mindmaps':
            return base + 'Generate a mindmap in strict JSON format with format: {central: string, branches: [{topic, subtopics: [string]}]}.';
        case 'notes':
            return base + 'Generate structured review notes in markdown with key concepts, examples, and practice tips.';
    }
}

async function createStudyKitForSkill(
    supabase: any,
    userId: string,
    skillGraphId: string,
    skillId: string,
    skillName: string,
    skillDescription: string
) {
    try {
        // Check if study kit already exists for this skill
        const { data: existing } = await supabase
            .from('study_kit_content')
            .select('id')
            .eq('user_id', userId)
            .eq('skill_graph_id', skillGraphId)
            .eq('skill_id', skillId)
            .single();

        if (existing) {
            console.log('Study kit already exists for skill:', skillId);
            return;
        }

        const contentTypes: ContentType[] = ['quizzes', 'flashcards', 'mindmaps', 'notes'];

        const results = await Promise.all(
            contentTypes.map(async (type: ContentType) => {
                const result = await generateWithRetry({
                    prompt: buildPrompt(type, skillName, skillDescription),
                    systemPrompt: 'You are a study-kit AI assistant. Generate quizzes, flashcards, mindmaps, or notes in strict JSON or markdown format.',
                    schema: {},
                    temperature: 0.7,
                    maxTokens: 1000,
                });

                const output = type === 'notes' ? result.text : extractJSON(result.text);
                return { type, content: output };
            })
        );

        const generatedContent = Object.fromEntries(results.map(r => [r.type, r.content]));

        await supabase
            .from('study_kit_content')
            .insert({
                user_id: userId,
                skill_graph_id: skillGraphId,
                skill_id: skillId,
                title: `${skillName} - Study Kit`,
                source_type: 'skill',
                source_content: skillDescription,
                content_types: contentTypes,
                generated_content: generatedContent,
            });

        console.log('Study kit created for skill:', skillId);
    } catch (error) {
        console.error('Failed to create study kit:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { skillGraphId, skillId, masteryDelta, challengeId } = await request.json();

        if (!skillGraphId || !skillId || masteryDelta === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch current progress
        const { data: existing } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('skill_graph_id', skillGraphId)
            .eq('skill_id', skillId)
            .single();

        let newMasteryLevel = masteryDelta;
        let challengesCompleted = challengeId ? [challengeId] : [];
        const wasNotMastered = !existing || existing.mastery_level < 0.9;

        if (existing) {
            // Update existing progress
            newMasteryLevel = Math.min(existing.mastery_level + masteryDelta, 1.0);
            challengesCompleted = [
                ...(existing.challenges_completed || []),
                ...(challengeId ? [challengeId] : [])
            ];
        }

        // Upsert progress
        const { data, error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: user.id,
                skill_graph_id: skillGraphId,
                skill_id: skillId,
                mastery_level: newMasteryLevel,
                challenges_completed: challengesCompleted,
                last_practiced: new Date().toISOString(),
            }, {
                onConflict: 'user_id,skill_graph_id,skill_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Progress Update Error:', error);
            throw new Error('Failed to update progress');
        }

        // Create study kit if skill just reached mastery
        if (wasNotMastered && newMasteryLevel >= 0.9) {
            // Fetch skill details from skill graph
            const { data: skillGraph } = await supabase
                .from('skill_graphs')
                .select('nodes')
                .eq('id', skillGraphId)
                .single();

            if (skillGraph?.nodes) {
                const skill = skillGraph.nodes.find((n: any) => n.id === skillId);
                if (skill) {
                    // Create study kit asynchronously (don't wait)
                    createStudyKitForSkill(
                        supabase,
                        user.id,
                        skillGraphId,
                        skillId,
                        skill.name || skill.label,
                        skill.description || skill.data?.description || ''
                    ).catch(console.error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            progress: {
                skillId: data.skill_id,
                masteryLevel: data.mastery_level,
                challengesCompleted: data.challenges_completed,
            },
            studyKitCreated: wasNotMastered && newMasteryLevel >= 0.9
        });

    } catch (error: any) {
        console.error('Progress API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update progress' },
            { status: 500 }
        );
    }
}