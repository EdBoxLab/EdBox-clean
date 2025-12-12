import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

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

function buildPrompt(type: ContentType, prompt: string) {
  const base = `Base content:\n"${prompt}"\n\n`;
  switch (type) {
    case 'quizzes':
      return base + 'Generate EXACTLY 5 MCQ questions as strict JSON array.';
    case 'flashcards':
      return base + 'Generate EXACTLY 10 flashcards as strict JSON array.';
    case 'mindmaps':
      return base + 'Generate a mindmap in strict JSON format.';
    case 'notes':
      return base + 'Generate structured notes in markdown headings.';
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delay = 500) {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
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

    const groqApiKey = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_3;
    if (!groqApiKey) return NextResponse.json({ error: 'GROQ API key missing' }, { status: 500 });

    const groq = new Groq({ apiKey: groqApiKey });
    const model = process.env.GROQ_MODEL ?? 'llama3-7b-4096';

    const results = await Promise.all(
      contentTypes.map(async (type: ContentType) => {
        const output = await retry(async () => {
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: 'system',
                content:
                  'You are a study-kit AI assistant. Generate quizzes, flashcards, mindmaps, or notes in strict JSON or markdown format.',
              },
              { role: 'user', content: buildPrompt(type, prompt) },
            ],
            model,
            temperature: 0.7,
            max_tokens: 1000,
          } as any);

          const text = (completion as any)?.choices?.[0]?.message?.content ?? '';
          return type === 'notes' ? text : extractJSON(text);
        }, 3, 500);

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
