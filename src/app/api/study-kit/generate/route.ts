import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';
import { detectChapters, detectChaptersFromLargeFile } from '@/lib/chapter-detection';
import type { DetectedChapter } from '@/types/chapters';
import { getRateLimiter } from '@/lib/rate-limit';
import { generateChapterContent, generateSingleContent } from '@/lib/study-kit/service';
import { ContentType } from '@/lib/study-kit/types';
import { buildStudyKitTitle } from '@/lib/study-kit/utils';
import {
  LARGE_FILE_THRESHOLD,
  FORCE_CHAPTER_THRESHOLD,
  MAX_CHAPTER_CONCURRENCY,
  MAX_SOURCE_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_CHAPTERS,
  MIN_CHAPTER_LENGTH,
} from '@/lib/study-kit/constants';

// ─── p-limit: install with `npm i p-limit` ─────────────────────────────────
// Caps simultaneous AI calls so we never saturate the Gemini rate limit or
// blow the serverless 60s timeout with 48 concurrent requests.
import pLimit from 'p-limit';

// ─── Request Validation ──────────────────────────────────────────────────────
// Parse and validate before touching any business logic. Unknown fields are
// stripped. Bad requests fail at the boundary, not 200 lines in.

const ContentTypeEnum = z.enum(['quizzes', 'flashcards', 'mindmaps', 'notes']);

const RequestBodySchema = z.object({
  // Text-based generation
  prompt: z.string().max(20_000).optional(),
  customInstructions: z.string().max(2_000).optional(),

  // File-based generation
  fileName: z.string().max(500).optional(),
  fileContent: z.string().optional(),  // base64 or raw text — validated by processFileContent
  fileType: z.string().max(100).optional(),

  // Content configuration
  contentTypes: z.array(ContentTypeEnum).min(1).max(4).optional(),
  itemCount: z.number().int().min(1).max(50).optional(),
  notesDepth: z.string().optional(),

  // Chapter flow
  useChapters: z.boolean().optional(),
  chapters: z.array(z.any()).optional(),  // DetectedChapter[] — typed downstream

  // Existing kit operations
  kitId: z.string().uuid().optional(),
  appendType: ContentTypeEnum.optional(),
}).strict();

type RequestBody = z.infer<typeof RequestBodySchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────


async function applyRateLimit(userId: string): Promise<NextResponse | null> {
  const ratelimit = getRateLimiter();
  if (!ratelimit) return null;

  try {
    const { success, limit, reset, remaining } = await ratelimit.limit(userId);
    if (success) return null;

    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'You have exceeded the maximum number of study kit generation requests. Please try again later.',
        retryAfter,
        resetAt: new Date(reset).toISOString(),
        limit,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  } catch (e: any) {
    // Rate limiter is best-effort. If Redis is down, let the request through.
    console.warn(`⚠️ Rate limiter unavailable (skipping): ${e.message}`);
    return null;
  }
}

// ─── Request Shape Handlers ───────────────────────────────────────────────────
// Each handler is responsible for exactly one request shape.
// The main POST function only routes between them.

/**
 * Shape 1 — Append/update content on an existing kit.
 * Caller sends kitId + appendType (or contentTypes for a full regeneration).
 */
async function handleKitUpdate(
  body: RequestBody,
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<NextResponse> {
  const { kitId, appendType, contentTypes, prompt, itemCount, notesDepth, customInstructions } = body;

  const { data: existingKit, error: fetchError } = await supabase
    .from('study_kit_content')
    .select('*')
    .eq('id', kitId!)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingKit) {
    return NextResponse.json({ error: 'Study kit not found' }, { status: 404 });
  }

  const sourcePrompt = existingKit.source_content ?? prompt ?? '';
  const typesToGenerate: ContentType[] = appendType ? [appendType] : (contentTypes as ContentType[] ?? ['quizzes', 'flashcards', 'mindmaps', 'notes']);

  const results = await Promise.allSettled(
    typesToGenerate.map(async (type) => ({
      type,
      content: await generateSingleContent(type, sourcePrompt, itemCount, notesDepth, customInstructions, !!appendType),
    }))
  );

  const newContent: Record<string, unknown> = {};
  const failures: string[] = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') newContent[r.value.type] = r.value.content;
    else failures.push(typesToGenerate[i]);
  });

  if (Object.keys(newContent).length === 0) {
    return NextResponse.json({ error: 'All content generation failed', failures }, { status: 500 });
  }

  const updatedContent = { ...existingKit.generated_content };

  if (appendType) {
    const existing = Array.isArray(updatedContent[appendType]) ? updatedContent[appendType] : [];
    const incoming = Array.isArray(newContent[appendType]) ? newContent[appendType] : [];
    updatedContent[appendType] = [...existing, ...incoming];
  } else {
    Object.assign(updatedContent, newContent);
  }

  const updatedTypes = Array.from(new Set([...(existingKit.content_types ?? []), ...Object.keys(newContent)]));

  const { data: updatedKit, error: updateError } = await supabase
    .from('study_kit_content')
    .update({ generated_content: updatedContent, content_types: updatedTypes })
    .eq('id', kitId!)
    .select('id')
    .single();

  if (updateError || !updatedKit) {
    return NextResponse.json({ error: 'Failed to save updated kit' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    id: updatedKit.id,
    content: updatedContent,
    partial: failures.length > 0,
    failures,
  });
}

/**
 * Shape 2 — Detect chapters from an uploaded file.
 * Returns chapter candidates for the client to review; does NOT generate content.
 * Triggered by: useChapters === true OR extractedText > FORCE_CHAPTER_THRESHOLD.
 */
async function handleChapterDetection(
  extractedText: string,
  fileName: string | undefined,
  forced: boolean
): Promise<NextResponse> {
  const textSize = extractedText.length;

  const chapterResult = textSize > LARGE_FILE_THRESHOLD
    ? await detectChaptersFromLargeFile(extractedText, { maxChapters: MAX_CHAPTERS, minChapterLength: MIN_CHAPTER_LENGTH })
    : await detectChapters(extractedText);

  return NextResponse.json({
    needsChapterReview: true,
    autoDetected: forced,
    chapters: chapterResult.chapters,
    documentAnalysis: chapterResult.documentAnalysis,
    recommendations: chapterResult.recommendations,
    fileName,
    textSize,
    message: forced
      ? 'Large file detected. Please review chapters before generation.'
      : undefined,
  });
}

/**
 * Shape 3 — Generate content for confirmed chapters.
 * Chapters are processed in batches capped at MAX_CHAPTER_CONCURRENCY to avoid:
 * (a) serverless timeout from 48 simultaneous AI calls
 * (b) Gemini / OpenAI rate limit hammering
 *
 * Response returns only the kit ID — NOT the full content blob.
 * The client fetches individual chapters on demand via GET /api/study-kit/[id]/chapter/[index].
 */
async function handleChapterGeneration(
  body: RequestBody,
  userId: string,
  finalPrompt: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<NextResponse> {
  const { chapters: confirmedChapters, contentTypes, itemCount, notesDepth, customInstructions, prompt, fileName } = body;
  const typesToGenerate: ContentType[] = contentTypes as ContentType[] ?? ['quizzes', 'flashcards', 'mindmaps', 'notes'];

  const limit = pLimit(MAX_CHAPTER_CONCURRENCY);

  const chapterPromises = (confirmedChapters as DetectedChapter[]).map((chapter, i) =>
    limit(async () => {
      const chapterContent = await generateChapterContent(
        chapter, i, typesToGenerate, itemCount, notesDepth, customInstructions
      );
      return { index: i, chapterContent };
    })
  );

  const settled = await Promise.allSettled(chapterPromises);

  const chapterContents: unknown[] = [];
  const failedChapters: number[] = [];

  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      chapterContents[r.value.index] = r.value.chapterContent;
    } else {
      failedChapters.push(i);
      console.error(`❌ Chapter ${i} generation failed:`, r.reason);
    }
  });

  // At least one chapter must have succeeded
  if (chapterContents.filter(Boolean).length === 0) {
    return NextResponse.json({ error: 'All chapter generation failed', failedChapters }, { status: 500 });
  }

  console.log(`[handleChapterGeneration] calling buildStudyKitTitle with prompt="${finalPrompt}", fileName="${fileName}"`);
  const title = buildStudyKitTitle(
    prompt ?? body.chapters?.[0]?.title ?? fileName,
    fileName
  );
  console.log(`[handleChapterGeneration] title result="${title}"`);

  const { data: studyKit, error: insertError } = await supabase
    .from('study_kit_content')
    .insert({
      user_id: userId,
      title,
      source_type: fileName ? 'file' : 'text',
      source_content: finalPrompt.substring(0, MAX_SOURCE_CONTENT_LENGTH),
      file_name: fileName ?? null,
      content_types: typesToGenerate,
      // Store content in DB — but we intentionally do NOT return it in this response.
      // The client requests per-chapter content via a dedicated endpoint to keep
      // response payloads small and allow progressive loading.
      generated_content: { chapters: chapterContents },
    })
    .select('id')
    .single();

  if (insertError || !studyKit) {
    console.error('❌ Study kit insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to save study kit' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    id: studyKit.id,
    hasChapters: true,
    chapterCount: chapterContents.filter(Boolean).length,
    failedChapters,
    // Partial success: the client can request retries for specific failedChapters indexes
    partial: failedChapters.length > 0,
  });
}

/**
 * Shape 4 — Single-pass generation (no chapters).
 * Used for text prompts and small files where the entire content fits in one AI call.
 */
async function handleSingleGeneration(
  body: RequestBody,
  userId: string,
  finalPrompt: string,
  contextChunks: string[] | undefined,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<NextResponse> {
  const { contentTypes, appendType, itemCount, notesDepth, customInstructions, prompt, fileName } = body;
  const typesToGenerate: ContentType[] = appendType ? [appendType] : (contentTypes as ContentType[] ?? ['quizzes', 'flashcards', 'mindmaps', 'notes']);

  const results = await Promise.allSettled(
    typesToGenerate.map(async (type) => ({
      type,
      content: await generateSingleContent(
        type, finalPrompt, itemCount, notesDepth, customInstructions, !!appendType, contextChunks
      ),
    }))
  );

  const generatedContent: Record<string, unknown> = {};
  const failures: string[] = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') generatedContent[r.value.type] = r.value.content;
    else {
      failures.push(typesToGenerate[i]);
      console.error(`❌ ${typesToGenerate[i]} generation failed:`, (r as PromiseRejectedResult).reason);
    }
  });

  if (Object.keys(generatedContent).length === 0) {
    return NextResponse.json({ error: 'All content generation failed', failures }, { status: 500 });
  }

  const title = buildStudyKitTitle(prompt, fileName);

  const { data: studyKit, error: insertError } = await supabase
    .from('study_kit_content')
    .insert({
      user_id: userId,
      title,
      source_type: fileName ? 'file' : 'text',
      source_content: finalPrompt.substring(0, MAX_SOURCE_CONTENT_LENGTH),
      file_name: fileName ?? null,
      content_types: Object.keys(generatedContent),
      generated_content: generatedContent,
    })
    .select('id')
    .single();

  if (insertError || !studyKit) {
    console.error('❌ Study kit insert failed:', insertError);
    return NextResponse.json({ error: 'Failed to save study kit' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    id: studyKit.id,
    content: generatedContent,
    partial: failures.length > 0,
    failures,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Rate limiting ──────────────────────────────────────────────────────────
    const rateLimitResponse = await applyRateLimit(user.id);
    if (rateLimitResponse) return rateLimitResponse;

    // ── Input validation ───────────────────────────────────────────────────────
    const rawBody = await request.json();
    const parseResult = RequestBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const body = parseResult.data;

    // ── Route: update existing kit ─────────────────────────────────────────────
    if (body.kitId) {
      return handleKitUpdate(body, user.id, supabase);
    }

    // ── Route: generate content for confirmed chapters ─────────────────────────
    // Checked BEFORE the prompt/file guard because chapter requests carry
    // content inside each chapter's sourceContext, not in prompt/fileContent.
    if (body.useChapters && body.chapters && body.chapters.length > 0) {
      console.log(`[handleChapterGeneration] body.prompt="${body.prompt}", body.fileName="${body.fileName}", body.chapters[0].title="${body.chapters?.[0]?.title}"`);
      const finalPrompt = body.prompt ?? body.chapters?.[0]?.title ?? 'Generate study materials';
      console.log(`[handleChapterGeneration] finalPrompt="${finalPrompt}"`);
      return handleChapterGeneration(body, user.id, finalPrompt, supabase);
    }

    // ── Guard: must have either prompt or file content ─────────────────────────
    if (!body.prompt && !body.fileContent) {
      return NextResponse.json({ error: 'Missing required field: prompt or fileContent' }, { status: 400 });
    }

    // ── File processing ────────────────────────────────────────────────────────
    // extractedText and contextChunks are local — no more (request as any) mutation.
    let extractedText = '';
    let finalPrompt = body.prompt ?? '';
    let contextChunks: string[] | undefined;

    if (body.fileContent) {
      try {
        extractedText = await processFileContent(body.fileContent, body.fileType ?? '', body.fileName ?? '');
        const contextSummaries = await extractContextFromText(extractedText);

        if (contextSummaries.length === 1) {
          finalPrompt = `Based on the following extracted document context (${body.fileName}):\n\n${contextSummaries[0]}\n\nUser Context: ${body.prompt ?? 'Generate study materials'}\n\nIMPORTANT: Only generate content relevant to the provided document context.`;
        } else {
          contextChunks = contextSummaries.map(
            (summary) => `Based on document section (${body.fileName}):\n\n${summary}\n\nUser Context: ${body.prompt ?? 'Generate study materials'}`
          );
          finalPrompt = contextChunks[0];
        }
      } catch (err) {
        // File processing failed. If a text prompt exists, fall through to text generation.
        // If there's no fallback prompt, fail loudly with a meaningful error.
        console.error('❌ File processing failed:', err);
        if (!body.prompt) {
          return NextResponse.json({ error: 'File processing failed and no prompt fallback provided' }, { status: 422 });
        }
      }
    }

    // ── Route: force chapter mode for very large files ─────────────────────────
    // This is a guard before generation — the client MUST review chapters first.
    if (extractedText.length > FORCE_CHAPTER_THRESHOLD && !body.useChapters) {
      return handleChapterDetection(extractedText, body.fileName, /* forced */ true);
    }

    // ── Route: explicit chapter detection request ──────────────────────────────
    if (body.useChapters && !body.chapters && extractedText) {
      return handleChapterDetection(extractedText, body.fileName, /* forced */ false);
    }

    // ── Route: single-pass generation ─────────────────────────────────────────
    return handleSingleGeneration(body, user.id, finalPrompt, contextChunks, supabase);

  } catch (error: any) {
    console.error('❌ Study kit generation failed:', error);
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
// Only fetch metadata for the list view — NOT generated_content.
// generated_content is a large JSONB blob and is completely irrelevant when
// rendering a kit list. Fetch it only when the user opens a specific kit.

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('study_kit_content')
      .select('id, title, source_type, file_name, content_types, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Study kit fetch failed:', error);
      return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }

    return NextResponse.json({ studyKits: data ?? [] });
  } catch (error: any) {
    console.error('❌ Study kit GET failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
