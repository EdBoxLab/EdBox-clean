import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { getUserTier } from '@/lib/usage';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tier = await getUserTier();
    if (tier !== 'premium') {
      return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const { currentContent, instructions, isMore } = await request.json();

    console.log('📝 NOTES GENERATION REQUEST:', { instructions, isMore, contentLength: currentContent?.length });

    const prompt = isMore 
      ? `Based on the following content, generate MORE detailed notes. 
         Follow these specific instructions: ${instructions || 'Expand on the key concepts.'}
         
         Current Content:
         ${currentContent}
         
         Only return the NEW content to be appended.`
      : `Generate detailed study notes based on the following instructions: ${instructions || 'Create comprehensive notes.'}
         
         Context/Existing Content (if any):
         ${currentContent}
         
         Format the notes clearly with headings and bullet points.`;

      const result = await generateWithRetry({
        prompt,
        systemPrompt: 'You are an expert academic note-taker. Create structured, detailed, and clear study notes in Markdown format. DO NOT start your response with a code block. Start with a clear heading (# [Topic]).',
        temperature: 0.7,
        maxTokens: 2000,
      });

    console.log('🤖 AI RETURNED FOR NOTES:', result.text);

    return NextResponse.json({ content: result.text });
  } catch (error) {
    console.error('Notes generation error:', error);
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 });
  }
}
