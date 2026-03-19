import "@/lib/polyfills";
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { processFileContent } from '@/lib/utils/fileProcessing';
import type { DetectedChapter } from '@/types/chapters';
import { getRateLimiter } from '@/lib/rate-limit';
import { sendEvent } from '@/lib/study-kit/utils';
import { generateChapterContent, generateSingleContent } from '@/lib/study-kit/service';
import { ContentType, StudyKitGenerationParams } from '@/lib/study-kit/types';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ratelimit = getRateLimiter();
  if (ratelimit) {
    try {
      const { success, reset } = await ratelimit.limit(user.id);
      if (!success) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        }), { status: 429 });
      }
    } catch (e: any) {
      console.warn(`⚠️ Rate limiter unavailable (skipping): ${e.message}`);
    }
  }

  const body: StudyKitGenerationParams = await request.json();
  const {
    prompt,
    contentTypes,
    fileName,
    fileContent,
    fileType,
    chapters: confirmedChapters,
    itemCount,
    notesDepth,
    customInstructions
  } = body;

  let finalPrompt = prompt || '';
  let extractedText = '';

  if (fileContent && !confirmedChapters) {
    try {
      extractedText = await processFileContent(fileContent, fileType || '', fileName || '');
      finalPrompt = extractedText.substring(0, 10000);
    } catch (err) {
      console.error('File processing failed:', err);
    }
  }

  if (!finalPrompt && !confirmedChapters) {
    return new Response('Missing data', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const typesToGenerate: ContentType[] = contentTypes || ['quizzes', 'flashcards', 'mindmaps', 'notes'];
        const chapters = confirmedChapters as DetectedChapter[] | undefined;

        // Send plan event with type list and ETA for frontend progress UI
        const estimatedSeconds = chapters && chapters.length > 0
          ? chapters.length * 8
          : Math.max(5, typesToGenerate.length * 4);

        sendEvent(controller, 'plan', {
          types: typesToGenerate,
          estimatedSeconds,
          chapterCount: chapters?.length || 0,
          message: chapters && chapters.length > 0
            ? `Generating ${typesToGenerate.join(', ')} across ${chapters.length} chapters...`
            : `Generating ${typesToGenerate.join(', ')}...`
        });

        sendEvent(controller, 'start', { message: 'Starting generation...' });

        if (chapters && chapters.length > 0) {
          sendEvent(controller, 'chapters_detected', { count: chapters.length });

          const chapterPromises = chapters.map(async (chapter, i) => {
            const chapterContent = await generateChapterContent(
              chapter,
              i,
              typesToGenerate,
              itemCount,
              notesDepth,
              customInstructions,
              controller
            );
            return { index: i, chapterContent };
          });

          const chapterResults = await Promise.all(chapterPromises);
          const chapterContents = chapterResults
            .sort((a, b) => a.index - b.index)
            .map(r => r.chapterContent);

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

          sendEvent(controller, 'complete', {
            id: studyKit?.id,
            title,
            chapterCount: chapters.length
          });
        } else {
          // PARALLEL generation — all content types run simultaneously
          const generatedContent: any = {};

          const results = await Promise.allSettled(
            typesToGenerate.map(async (type) => {
              const content = await generateSingleContent(
                type,
                finalPrompt,
                itemCount,
                notesDepth,
                customInstructions,
                false,
                undefined,
                controller
              );
              generatedContent[type] = content;
              return { type, content };
            })
          );

          // Log any failures
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              console.error(`${typesToGenerate[i]} generation failed:`, r.reason);
            }
          });

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
              content_types: Object.keys(generatedContent).filter(k => generatedContent[k] !== null),
              generated_content: generatedContent,
            })
            .select()
            .single();

          sendEvent(controller, 'complete', { id: studyKit?.id, title });
        }

        controller.close();
      } catch (error: any) {
        console.error('Stream error:', error);
        sendEvent(controller, 'error', { message: error.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
