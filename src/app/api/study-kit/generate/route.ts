import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { QUIZ_TEMPLATE, FLASHCARD_TEMPLATE, NOTES_TEMPLATE, MINDMAP_TEMPLATE } from './templates';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

function extractJSON(text: string) {
  try {
    const fenced = text.match(/```json([\s\S]*?)```/i);
    const raw = fenced ? fenced[1] : text;
    // Clean up potentially problematic characters that might break JSON.parse
    const cleaned = raw
      .replace(/[\n\r]+/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON Extraction Error:', e, 'Raw text:', text);
    return text;
  }
}

function buildPrompt(type: ContentType, prompt: string) {
  const base = `Topic/Content to process: "${prompt}"\n\n`;
  switch (type) {
    case 'quizzes':
      return base + QUIZ_TEMPLATE;
    case 'flashcards':
      return base + FLASHCARD_TEMPLATE;
    case 'mindmaps':
      return base + MINDMAP_TEMPLATE;
    case 'notes':
      return base + NOTES_TEMPLATE;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { prompt, contentTypes, fileName } = body ?? {};
    if (!prompt || !contentTypes?.length)
      return NextResponse.json({ error: 'Prompt and content types are required' }, { status: 400 });

    const results = await Promise.all(
      contentTypes.map(async (type: ContentType) => {
        const result = await generateWithRetry({
          prompt: buildPrompt(type, prompt),
          systemPrompt: 'You are an elite, professional study-kit AI assistant. Your goal is to create beautiful, organized, and deeply educational resources. Follow templates exactly. Ensure notes are comprehensive and long-form.',
          temperature: 0.7,
          maxTokens: type === 'notes' ? 3000 : 2000,
        });

        const output = type === 'notes' ? result.text : extractJSON(result.text);
        return { type, content: output };
      })
    );

    const generatedContent = Object.fromEntries(results.map(r => [r.type, r.content]));

    const { data: studyKit, error: dbError } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title: prompt.slice(0, 100),
        source_type: fileName ? 'file' : 'text',
        source_content: prompt,
        file_name: fileName || null,
        content_types: contentTypes,
        generated_content: generatedContent,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, id: studyKit.id, content: generatedContent });
  } catch (error: any) {
    console.error('Study Kit POST Error:', error);
    return NextResponse.json({ error: 'Failed to generate study kit', details: error?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('study_kit_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ studyKits: data });
  } catch (error: any) {
    console.error('Study Kit GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch study kits', details: error?.message }, { status: 500 });
  }
}
