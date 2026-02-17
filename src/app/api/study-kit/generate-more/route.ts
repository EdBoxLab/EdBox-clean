import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

type ContentType = 'quizzes' | 'flashcards' | 'notes';

const BATCH_SIZE = 10;

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
    cleaned = cleaned
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\\n/g, ' ')
      .replace(/\r?\n/g, ' ');

    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');

    if (start === -1 || end === -1) {
      throw new Error('No valid JSON array found');
    }

    cleaned = cleaned.substring(start, end + 1);
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      cleaned = cleaned.replace(/\\(?!"|\\)/g, '\\\\').replace(/[\u0000-\u001F]/g, '');
      parsed = JSON.parse(cleaned);
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
    console.error(`JSON extraction failed for ${type}:`, error);
    throw new Error(`Failed to parse ${type}: ${error}`);
  }
}

const MORE_QUIZ_TEMPLATE = `
Generate 10 NEW high-quality multiple-choice questions.

CRITICAL REQUIREMENTS:
- correctAnswer MUST be 0, 1, 2, or 3 (NOT 1-4!)
- 0 = first option, 1 = second option, 2 = third option, 3 = fourth option
- Generate DIFFERENT questions from what was already generated
- Vary difficulty levels

Output format (ONLY JSON, no other text):
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is correct (index 2, third option).",
    "difficulty": "Easy"
  }
]
`;

const MORE_FLASHCARD_TEMPLATE = `
Generate 10 NEW professional flashcards that focus on different concepts than what was already covered.
Each card should include:
- Front: The concept or question.
- Back: The detailed explanation or answer.
- Hint: A subtle clue to help the learner.

Format as a JSON array:
[
  {
    "front": "string",
    "back": "string",
    "hint": "string"
  }
]
`;

const CUSTOM_NOTES_TEMPLATE = `
Generate detailed study notes based on the user's specific requirements.
Use Markdown for formatting with clear headers (H1, H2, H3).
Focus ONLY on what the user has specifically requested.
Be thorough and comprehensive in covering the requested aspects.
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { studyKitId, contentType, existingContent, customPrompt, notesSpecification, isAdReward } = body;

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
    const hasFileContext = !!studyKit.source_content;

    let newContent: any;

    if (contentType === 'quizzes' || contentType === 'flashcards') {
      const existingItems = existingContent?.map((item: any) =>
        contentType === 'quizzes' ? item.question : item.front
      ).join('\n- ') || '';

      const template = contentType === 'quizzes' ? MORE_QUIZ_TEMPLATE : MORE_FLASHCARD_TEMPLATE;
      const contextPrefix = hasFileContext
        ? `SOURCE MATERIAL (generate content STRICTLY from this):\n${sourceContext}\n\n`
        : `Topic: ${studyKit.title}\n\n`;

      const basePrompt = `${contextPrefix}Already covered (DO NOT repeat these):\n- ${existingItems}\n\n${template}`;

      const result = await generateWithRetry({
        prompt: basePrompt,
        systemPrompt: 'Output ONLY valid JSON with no extra text.',
        temperature: 0.7,
        maxTokens: 4000,
        model: 'llama-3.1-8b-instant',
      });

      newContent = extractJSON(result.text, contentType);
    } else if (contentType === 'notes') {
      if (!notesSpecification) {
        return NextResponse.json({ error: 'Notes specification required' }, { status: 400 });
      }

      const contextPrefix = hasFileContext
        ? `SOURCE MATERIAL (base notes STRICTLY on this):\n${sourceContext}\n\n`
        : `Topic: ${studyKit.title}\n\n`;

      const prompt = `${contextPrefix}User's Specific Requirements:\n${notesSpecification}\n\n${CUSTOM_NOTES_TEMPLATE}`;

      const result = await generateWithRetry({
        prompt,
        systemPrompt: 'You are an expert study note creator. Output only Markdown formatted notes.',
        temperature: 0.7,
        maxTokens: 3000,
        model: 'llama-3.3-70b-versatile',
      });

      newContent = result.text;
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

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
