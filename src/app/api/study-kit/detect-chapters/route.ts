import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { detectChapters } from '@/lib/chapter-detection';
import { processFileContent } from '@/lib/utils/fileProcessing';
import type { ChapterDetectionOptions } from '@/types/chapters';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      text, 
      fileContent, 
      fileName, 
      fileType,
      options 
    } = body;

    let contentToAnalyze = text || '';

    if (fileContent && !text) {
      try {
        const extractedText = await processFileContent(
          fileContent, 
          fileType || '', 
          fileName || ''
        );
        contentToAnalyze = extractedText;
      } catch (err) {
        console.error('File processing failed:', err);
        return NextResponse.json(
          { error: 'Failed to process file content' }, 
          { status: 400 }
        );
      }
    }

    if (!contentToAnalyze?.trim()) {
      return NextResponse.json(
        { error: 'No content provided for chapter detection' }, 
        { status: 400 }
      );
    }

    const detectionOptions: ChapterDetectionOptions = {
      minChapters: options?.minChapters ?? 1,
      maxChapters: options?.maxChapters ?? 10,
      minChapterLength: options?.minChapterLength ?? 3000,
      preferExplicit: options?.preferExplicit ?? true,
      maxTokens: options?.maxTokens ?? 4000
    };

    const result = await detectChapters(contentToAnalyze, detectionOptions);

    return NextResponse.json({
      success: true,
      ...result,
      meta: {
        contentLength: contentToAnalyze.length,
        detectedAt: new Date().toISOString(),
        detectionModel: 'gemini-3.1-flash-lite-preview'
      }
    });

  } catch (error: any) {
    console.error('Chapter detection failed:', error);
    return NextResponse.json(
      { error: error.message || 'Chapter detection failed' }, 
      { status: 500 }
    );
  }
}
