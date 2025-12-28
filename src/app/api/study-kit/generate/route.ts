import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry, extractContextFromText } from '@/lib/ai-providers';
import { QUIZ_TEMPLATE, FLASHCARD_TEMPLATE, NOTES_TEMPLATE, MINDMAP_TEMPLATE } from './templates';
import { processFileContent } from '@/lib/utils/fileProcessing';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

function sanitizeMathText(text: string): string {
  if (typeof text !== 'string') return String(text || '');
  return text
    .replace(/[\u2200-\u22FF]/g, (char) => {
      const mathMap: Record<string, string> = {
        '\u221A': 'sqrt', '\u00B2': '^2', '\u00B3': '^3', '\u00B9': '^1',
        '\u2264': '<=', '\u2265': '>=', '\u2260': '!=', '\u00D7': '*',
        '\u00F7': '/', '\u03C0': 'pi', '\u221E': 'infinity',
      };
      return mathMap[char] || char;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJSON(text: string, type: ContentType) {
  try {
    let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    
    // Preliminary cleaning to handle common AI JSON artifacts
    cleaned = cleaned
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\\n/g, ' ')           // Convert escaped newlines to spaces
      .replace(/\r?\n/g, ' ');        // Convert actual newlines to spaces
    
    // Find the actual JSON structure
    const start = cleaned.indexOf(type === 'mindmaps' ? '{' : '[');
    const end = cleaned.lastIndexOf(type === 'mindmaps' ? '}' : ']');
    
    if (start === -1 || end === -1) {
      // Fallback: if we're looking for an array but found an object (common AI mistake)
      if (type !== 'mindmaps') {
        const altStart = cleaned.indexOf('{');
        const altEnd = cleaned.lastIndexOf('}');
        if (altStart !== -1 && altEnd !== -1) {
          const possibleObj = cleaned.substring(altStart, altEnd + 1);
          try {
            const parsedObj = JSON.parse(possibleObj);
            // If it has a property that looks like our array, use that
            const arrayKey = Object.keys(parsedObj).find(key => Array.isArray(parsedObj[key]));
            if (arrayKey) return parsedObj[arrayKey];
          } catch (e) { /* ignore and throw original error */ }
        }
      }
      throw new Error('No valid JSON structure found in AI response');
    }
    
    cleaned = cleaned.substring(start, end + 1);
    
    // Remove trailing commas before closing brackets/braces
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // More aggressive cleaning for math-heavy content
      cleaned = cleaned
        // Escape all backslashes that aren't already escaping a quote or backslash
        // This is crucial for LaTeX/Math symbols like \sqrt, \frac, etc.
        .replace(/\\(?!"|\\)/g, '\\\\')
        // Remove any remaining control characters
        .replace(/[\u0000-\u001F]/g, '');
      
      try {
        parsed = JSON.parse(cleaned);
      } catch (secondError) {
        console.error(`❌ Second JSON parse attempt failed for ${type}:`, secondError);
        // Last ditch effort: try to fix missing quotes around keys or other common issues
        // but for now, we'll throw to trigger retry or failure
        throw secondError;
      }
    }
    
    if (type === 'quizzes' && Array.isArray(parsed)) {
      return parsed.map((q, i) => ({
        question: sanitizeMathText(q.question || `Question ${i + 1}`),
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.slice(0, 4).map((opt: any) => sanitizeMathText(opt))
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : (typeof q.correctAnswer === 'string' ? Math.min(3, Math.max(0, parseInt(q.correctAnswer) || 0)) : 0),
        explanation: sanitizeMathText(q.explanation || 'No explanation provided.'),
        difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
      }));
    }
    
    if (type === 'flashcards' && Array.isArray(parsed)) {
      return parsed.filter(c => c.front && c.back).map(c => ({
        front: sanitizeMathText(c.front),
        back: sanitizeMathText(c.back),
        hint: sanitizeMathText(c.hint || ''),
      }));
    }
    
    return parsed;
  } catch (error) {
    console.error(`❌ JSON extraction failed for ${type}:`, error, 'Raw text sample:', text.substring(0, 500));
    throw new Error(`Failed to parse ${type}: ${error}`);
  }
}

function buildPrompt(type: ContentType, prompt: string) {
  const base = `Topic/Content Source: "${prompt}"\n\n`;
  
  switch (type) {
    case 'quizzes':
      return base + `${QUIZ_TEMPLATE}

CRITICAL: correctAnswer is 0-indexed (0=first option, 3=fourth option)
Output ONLY JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"Easy"}]`;

    case 'flashcards':
      return base + FLASHCARD_TEMPLATE + '\nOutput ONLY JSON array.';

    case 'mindmaps':
      return base + MINDMAP_TEMPLATE + '\nOutput ONLY JSON object.';

    case 'notes':
      return base + NOTES_TEMPLATE;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { prompt, contentTypes, fileName, fileContent, fileType } = body;

    if ((!prompt && !fileContent) || !contentTypes?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Process file if provided
    let finalPrompt = prompt || '';
    if (fileContent) {
      try {
        console.log(`📄 Processing file in study kit: ${fileName} (${fileType})`);
        const extractedText = await processFileContent(fileContent, fileType || '', fileName || '');
        
        // NEW: Extract meaningful context instead of sending raw text
        const contextSummary = await extractContextFromText(extractedText);
        
        finalPrompt = `Based on the following extracted document context (${fileName}):\n\n${contextSummary}\n\nUser Context: ${prompt || 'Generate study materials'}\n\nIMPORTANT: Only generate content that is relevant to the provided document context.`;
        console.log(`✅ File processed and context extracted, total prompt length: ${finalPrompt.length}`);
      } catch (err) {
        console.error('❌ File processing failed in study kit:', err);
        // Fallback to prompt only
      }
    }

    const results = await Promise.allSettled(
      contentTypes.map(async (type: ContentType) => {
          const result = await generateWithRetry({
            prompt: buildPrompt(type, finalPrompt),
            systemPrompt: 'Output ONLY valid JSON with no extra text.',
            temperature: 0.7,
            maxTokens: type === 'notes' ? 3000 : 4000,
          });

        const output = type === 'notes' ? result.text : extractJSON(result.text, type);
        return { type, content: output };
      })
    );

    const generatedContent: any = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        generatedContent[r.value.type] = r.value.content;
      }
    });

    if (Object.keys(generatedContent).length === 0) {
      return NextResponse.json({ error: 'All failed' }, { status: 500 });
    }

    // Generate a better title if it was a file
    let title = prompt?.slice(0, 100) || fileName?.split('.')[0] || 'Study Kit';
    if (title.length < 3) title = 'My Study Kit';

    const { data: studyKit } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title: title,
        source_type: fileName ? 'file' : 'text',
        source_content: finalPrompt.substring(0, 5000), // Store partial context for reference
        file_name: fileName,
        content_types: Object.keys(generatedContent),
        generated_content: generatedContent,
      })
      .select()
      .single();

    return NextResponse.json({ 
      success: true, 
      id: studyKit?.id, 
      content: generatedContent 
    });

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
