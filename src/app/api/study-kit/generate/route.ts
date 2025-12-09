import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getSupabaseClient(request: NextRequest) {
  return createServerClient({
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: any) =>
        request.cookies.set({ name, value, ...options }),
      remove: (name: string, options: any) =>
        request.cookies.delete({ name, ...options }),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, contentTypes, fileName } = await request.json();

    if (!prompt || !contentTypes || contentTypes.length === 0) {
      return NextResponse.json(
        { error: 'Prompt and content types are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const generatedContent: any = {};

    for (const type of contentTypes) {
      let typePrompt = '';

      switch (type) {
        case 'quizzes':
          typePrompt = `Generate 5 multiple-choice quiz questions based on this content: "${prompt}". 
          Format as JSON array with structure: [{ question: string, options: string[], correctAnswer: number }]`;
          break;

        case 'flashcards':
          typePrompt = `Generate 10 flashcards based on this content: "${prompt}". 
          Format as JSON array with structure: [{ front: string, back: string }]`;
          break;

        case 'notes':
          typePrompt = `Create comprehensive study notes based on this content: "${prompt}". 
          Include main points, key concepts, and important details. Format as structured text with headings.`;
          break;

        case 'mindmaps':
          typePrompt = `Create a mind map structure based on this content: "${prompt}". 
          Format as JSON with structure: { central: string, branches: [{ topic: string, subtopics: string[] }] }`;
          break;
      }

      try {
        const result = await model.generateContent(typePrompt);
        const response = result.response.text();

        if (type === 'quizzes' || type === 'flashcards' || type === 'mindmaps') {
          try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
              response.match(/```\n([\s\S]*?)\n```/);
            const jsonText = jsonMatch ? jsonMatch[1] : response;
            generatedContent[type] = JSON.parse(jsonText);
          } catch {
            generatedContent[type] = response;
          }
        } else {
          generatedContent[type] = response;
        }
      } catch (genError) {
        console.error(`Error generating ${type}:`, genError);
        generatedContent[type] = `Error generating ${type}`;
      }
    }

    const { data: studyKit, error: dbError } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: session.user.id,
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

    return NextResponse.json({
      success: true,
      content: generatedContent,
      id: studyKit.id,
    });

  } catch (error) {
    console.error('Study Kit generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate study kit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: studyKits, error } = await supabase
      .from('study_kit_content')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ studyKits });

  } catch (error) {
    console.error('Study Kit GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study kits' },
      { status: 500 }
    );
  }
}
