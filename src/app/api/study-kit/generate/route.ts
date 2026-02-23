import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';
import { detectChapters, detectChaptersFromLargeFile } from '@/lib/chapter-detection';
import type { DetectedChapter, ChapterContent } from '@/types/chapters';
import { getRateLimiter } from '@/lib/rate-limit';
import { generateChapterContent, generateSingleContent } from '@/lib/study-kit/service';
import { ContentType, NoteType } from '@/lib/study-kit/types';
import { LARGE_FILE_THRESHOLD, FORCE_CHAPTER_THRESHOLD } from '@/lib/study-kit/constants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ratelimit = getRateLimiter();
    if (ratelimit) {
      const { success, limit, reset, remaining } = await ratelimit.limit(user.id);
      if (!success) {
        const resetDate = new Date(reset);
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'You have exceeded the maximum number of study kit generation requests. Please try again later.',
            retryAfter,
            resetAt: resetDate.toISOString(),
            limit,
            remaining: 0
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': retryAfter.toString()
            }
          }
        );
      }
    }

    const body = await request.json();
    const { prompt, contentTypes, fileName, fileContent, fileType, kitId, appendType, customInstructions, itemCount, notesDepth, useChapters, chapters: confirmedChapters } = body;

    let finalPrompt = prompt || '';
    let existingKit = null;
    let extractedText = '';

    if (kitId) {
      const { data } = await supabase
        .from('study_kit_content')
        .select('*')
        .eq('id', kitId)
        .eq('user_id', user.id)
        .single();
      if (!data) return NextResponse.json({ error: 'Study kit not found' }, { status: 404 });
      existingKit = data;
      finalPrompt = data.source_content || prompt || '';
    }

    if ((!finalPrompt && !fileContent) && !kitId && !confirmedChapters) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (fileContent && !kitId) {
      try {
        extractedText = await processFileContent(fileContent, fileType || '', fileName || '');
        const contextSummaries = await extractContextFromText(extractedText);
        if (contextSummaries.length === 1) {
          finalPrompt = `Based on the following extracted document context (${fileName}):\n\n${contextSummaries[0]}\n\nUser Context: ${prompt || 'Generate study materials'}\n\nIMPORTANT: Only generate content that is relevant to the provided document context.`;
        } else {
          (request as any).contextChunks = contextSummaries.map(summary =>
            `Based on document section (${fileName}):\n\n${summary}\n\nUser Context: ${prompt || 'Generate study materials'}`
          );
          finalPrompt = (request as any).contextChunks[0];
        }
      } catch (err) {
        console.error('❌ File processing failed:', err);
      }
    }

    if (extractedText && extractedText.length > FORCE_CHAPTER_THRESHOLD && !useChapters) {
      const chapterResult = await detectChaptersFromLargeFile(extractedText, { maxChapters: 12, minChapterLength: 2000 });

      return NextResponse.json({
        needsChapterReview: true,
        autoDetected: true,
        chapters: chapterResult.chapters,
        documentAnalysis: chapterResult.documentAnalysis,
        recommendations: chapterResult.recommendations,
        fileName,
        textSize: extractedText.length,
        message: 'Large file detected. Please review chapters before generation.'
      });
    }

    if (useChapters && !confirmedChapters && extractedText) {
      const textSize = extractedText.length;
      const chapterResult = textSize > LARGE_FILE_THRESHOLD
        ? await detectChaptersFromLargeFile(extractedText, { maxChapters: 12, minChapterLength: 2000 })
        : await detectChapters(extractedText);

      return NextResponse.json({
        needsChapterReview: true,
        chapters: chapterResult.chapters,
        documentAnalysis: chapterResult.documentAnalysis,
        recommendations: chapterResult.recommendations,
        fileName,
        textSize
      });
    }

    if (useChapters && confirmedChapters && confirmedChapters.length > 0) {
      const typesToGenerate: ContentType[] = contentTypes || ['quizzes', 'flashcards', 'mindmaps', 'notes'];
      const chapterPromises = (confirmedChapters as DetectedChapter[]).map(async (chapter, i) => {
        const chapterContent = await generateChapterContent(chapter, i, typesToGenerate, itemCount, notesDepth, customInstructions);
        return { index: i, chapterContent };
      });

      const chapterResults = await Promise.all(chapterPromises);
      const chapterContents = chapterResults.sort((a, b) => a.index - b.index).map(r => r.chapterContent);

      let title = prompt?.slice(0, 100) || fileName?.split('.')[0] || 'Study Kit';
      if (title.length < 3) title = 'My Study Kit';

      const { data: studyKit } = await supabase
        .from('study_kit_content')
        .insert({
          user_id: user.id,
          title,
          source_type: fileName ? 'file' : 'text',
          source_content: finalPrompt.substring(0, 5000),
          file_name: fileName,
          content_types: typesToGenerate,
          generated_content: { chapters: chapterContents },
        })
        .select()
        .single();

      return NextResponse.json({ success: true, id: studyKit?.id, content: { chapters: chapterContents }, hasChapters: true });
    }

    const typesToGenerate: ContentType[] = appendType ? [appendType] : (contentTypes || ['quizzes', 'flashcards', 'mindmaps', 'notes']);
    const generatedContent: any = {};
    const chunks = (request as any).contextChunks;

    const results = await Promise.allSettled(
      typesToGenerate.map(async (type) => {
        const content = await generateSingleContent(type, finalPrompt, itemCount, notesDepth, customInstructions, !!appendType, chunks);
        return { type, content };
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') generatedContent[r.value.type] = r.value.content;
    });

    if (Object.keys(generatedContent).length === 0) return NextResponse.json({ error: 'Generation failed' }, { status: 500 });

    if (kitId && existingKit) {
      const updatedGeneratedContent = { ...existingKit.generated_content };
      if (appendType) {
        const existingList = Array.isArray(updatedGeneratedContent[appendType]) ? updatedGeneratedContent[appendType] : [];
        const newList = Array.isArray(generatedContent[appendType]) ? generatedContent[appendType] : [];
        updatedGeneratedContent[appendType] = [...existingList, ...newList];
      } else {
        Object.assign(updatedGeneratedContent, generatedContent);
      }

      const { data: updatedKit } = await supabase
        .from('study_kit_content')
        .update({
          generated_content: updatedGeneratedContent,
          content_types: Array.from(new Set([...(existingKit.content_types || []), ...Object.keys(generatedContent)]))
        })
        .eq('id', kitId)
        .select()
        .single();

      return NextResponse.json({ success: true, id: updatedKit?.id, content: updatedGeneratedContent });
    }

    let title = prompt?.slice(0, 100) || fileName?.split('.')[0] || 'Study Kit';
    if (title.length < 3) title = 'My Study Kit';

    const { data: studyKit } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title,
        source_type: fileName ? 'file' : 'text',
        source_content: finalPrompt.substring(0, 5000),
        file_name: fileName,
        content_types: Object.keys(generatedContent),
        generated_content: generatedContent,
      })
      .select()
      .single();

    return NextResponse.json({ success: true, id: studyKit?.id, content: generatedContent });

  } catch (error: any) {
    console.error('❌ Study kit generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('study_kit_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ studyKits: data || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
