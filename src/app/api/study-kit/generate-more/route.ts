import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateSingleContent } from '@/lib/study-kit/service';
import { ContentType } from '@/lib/study-kit/types';
import { generateWithRetry } from '@/lib/ai-providers';
import { cleanMarkdown } from '@/lib/study-kit/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { studyKitId, contentType, existingContent, notesSpecification, isAdReward } = body;

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .single();

    const isPremium = subscription?.plan_id === 'premium' && subscription?.status === 'active';

    if (!isPremium && !isAdReward) {
      return NextResponse.json({ error: 'Premium subscription or ad reward required' }, { status: 403 });
    }

    if (!studyKitId || !contentType) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const { data: studyKit } = await supabase
      .from('study_kit_content')
      .select('*')
      .eq('id', studyKitId)
      .eq('user_id', user.id)
      .single();

    if (!studyKit) {
      return NextResponse.json({ error: 'Study kit not found' }, { status: 404 });
    }

    const sourceContext = studyKit.source_content || studyKit.title;
    let newContent: any;

    if (contentType === 'quizzes' || contentType === 'flashcards') {
      // Build a prompt that avoids repeating existing content
      const existingItems = existingContent?.map((item: any) =>
        contentType === 'quizzes' ? item.question : item.front
      ).join('\n- ') || '';

      const contextPrefix = studyKit.source_content
        ? `SOURCE MATERIAL (generate content STRICTLY from this):\n${sourceContext}\n\n`
        : `Topic: ${studyKit.title}\n\n`;

      const prompt = `${contextPrefix}Already covered (DO NOT repeat these):\n- ${existingItems}`;

      newContent = await generateSingleContent(
        contentType as ContentType,
        prompt,
        10,        // itemCount
        undefined, // notesDepth
        undefined, // customInstructions
        true       // isAppend = true → triggers "generate different" behavior
      );
    } else if (contentType === 'notes') {
      if (!notesSpecification) {
        return NextResponse.json({ error: 'Notes specification required' }, { status: 400 });
      }

      const contextPrefix = studyKit.source_content
        ? `SOURCE MATERIAL (base notes STRICTLY on this):\n${sourceContext}\n\n`
        : `Topic: ${studyKit.title}\n\n`;

      const result = await generateWithRetry({
        prompt: `${contextPrefix}User's Specific Requirements:\n${notesSpecification}\n\nGenerate detailed study notes based on the user's specific requirements. Use Markdown for formatting with clear headers. Focus ONLY on what the user has specifically requested.`,
        systemPrompt: 'You are an expert study note creator. Output only Markdown formatted notes.',
        temperature: 0.7,
        maxTokens: 3000,
        model: 'llama-3.3-70b-versatile',
      });

      newContent = cleanMarkdown(result.text);
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Merge new content into existing kit
    const updatedGeneratedContent = { ...studyKit.generated_content };

    if (contentType === 'notes') {
      const existingNotes = updatedGeneratedContent.notes || {};
      if (typeof existingNotes === 'object' && !Array.isArray(existingNotes) && existingNotes.deepExplanation !== undefined) {
        existingNotes.deepExplanation = (existingNotes.deepExplanation || '') + '\n\n---\n\n## Custom Notes\n\n' + newContent;
        updatedGeneratedContent.notes = existingNotes;
      } else {
        const oldNotes = typeof existingNotes === 'string' ? existingNotes : '';
        updatedGeneratedContent.notes = oldNotes + '\n\n---\n\n## Custom Notes\n\n' + newContent;
      }
    } else if (Array.isArray(newContent)) {
      const existingArray = updatedGeneratedContent[contentType] || [];
      updatedGeneratedContent[contentType] = [...existingArray, ...newContent];
    }

    const { error: updateError } = await supabase
      .from('study_kit_content')
      .update({ generated_content: updatedGeneratedContent })
      .eq('id', studyKitId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newContent,
      updatedContent: updatedGeneratedContent[contentType]
    });

  } catch (error: any) {
    console.error('Generate more failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
