import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { QUIZ_TEMPLATE, FLASHCARD_TEMPLATE, NOTES_TEMPLATE, MINDMAP_TEMPLATE } from './templates';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

// ============================================
// IMPROVED JSON EXTRACTION
// ============================================
function extractJSON(text: string, type: ContentType) {
  try {
    // Step 1: Extract from markdown code blocks if present
    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    let jsonText = fencedMatch ? fencedMatch[1] : text;
    
    // Step 2: Find the actual JSON structure
    const jsonStart = jsonText.indexOf(type === 'mindmaps' ? '{' : '[');
    const jsonEnd = jsonText.lastIndexOf(type === 'mindmaps' ? '}' : ']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`No valid JSON ${type === 'mindmaps' ? 'object' : 'array'} found`);
    }
    
    jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    
    // Step 3: Only fix trailing commas (don't touch content)
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas before } or ]
      .trim();
    
    // Step 4: Parse
    const parsed = JSON.parse(jsonText);
    
    // Step 5: Validate structure
    if (type === 'quizzes') {
      if (!Array.isArray(parsed)) throw new Error('Quizzes must be an array');
      
      parsed.forEach((q, idx) => {
        if (!q.question || typeof q.question !== 'string') {
          throw new Error(`Quiz ${idx}: Missing or invalid question`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Quiz ${idx}: Must have exactly 4 options`);
        }
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`Quiz ${idx}: correctAnswer must be 0-3`);
        }
        if (!q.explanation || typeof q.explanation !== 'string') {
          throw new Error(`Quiz ${idx}: Missing explanation`);
        }
        if (!['Easy', 'Medium', 'Hard'].includes(q.difficulty)) {
          console.warn(`Quiz ${idx}: Invalid difficulty "${q.difficulty}", defaulting to Medium`);
          q.difficulty = 'Medium';
        }
      });
    }
    
    if (type === 'flashcards') {
      if (!Array.isArray(parsed)) throw new Error('Flashcards must be an array');
      
      parsed.forEach((card, idx) => {
        if (!card.front || !card.back) {
          throw new Error(`Flashcard ${idx}: Missing front or back`);
        }
      });
    }
    
    if (type === 'mindmaps') {
      if (!parsed.central || !Array.isArray(parsed.branches)) {
        throw new Error('Mindmap must have central topic and branches array');
      }
    }
    
    return parsed;
    
  } catch (error) {
    console.error(`❌ JSON Extraction Error for ${type}:`, error);
    console.error('Raw text (first 500 chars):', text.substring(0, 500));
    throw new Error(`Failed to parse ${type}: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
  }
}

// ============================================
// IMPROVED PROMPTS WITH SCHEMA
// ============================================
function buildPrompt(type: ContentType, prompt: string) {
  const base = `Topic/Content: "${prompt}"\n\n`;
  
  switch (type) {
    case 'quizzes':
      return base + `${QUIZ_TEMPLATE}

CRITICAL: Respond with ONLY the JSON array, no other text. Example:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital and largest city of France. London is the capital of the UK, Berlin is the capital of Germany, and Madrid is the capital of Spain.",
    "difficulty": "Easy"
  }
]`;

    case 'flashcards':
      return base + `${FLASHCARD_TEMPLATE}

CRITICAL: Respond with ONLY the JSON array, no other text.`;

    case 'mindmaps':
      return base + `${MINDMAP_TEMPLATE}

CRITICAL: Respond with ONLY the JSON object, no other text.`;

    case 'notes':
      return base + NOTES_TEMPLATE;
  }
}

// ============================================
// MAIN ROUTE HANDLER
// ============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { prompt, contentTypes, fileName } = body ?? {};
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string' }, { status: 400 });
    }
    
    if (!contentTypes || !Array.isArray(contentTypes) || contentTypes.length === 0) {
      return NextResponse.json({ error: 'Content types array is required' }, { status: 400 });
    }

    console.log(`🎯 Generating study kit for: ${prompt.substring(0, 50)}...`);
    console.log(`📋 Content types: ${contentTypes.join(', ')}`);

    // Generate content with better error handling
    const results = await Promise.allSettled(
      contentTypes.map(async (type: ContentType) => {
        console.log(`🔄 Generating ${type}...`);
        
        try {
          const result = await generateWithRetry({
            prompt: buildPrompt(type, prompt),
            systemPrompt: 'You are an expert educational content generator. Output ONLY valid JSON with no additional text, markdown formatting, or explanations. Follow the exact schema provided.',
            temperature: type === 'quizzes' ? 0.7 : 0.8,
            maxTokens: type === 'notes' ? 3000 : 2000,
          });

          console.log(`✅ Raw ${type} response length: ${result.text.length}`);

          const output = type === 'notes' 
            ? result.text 
            : extractJSON(result.text, type);

          console.log(`✅ ${type} generated successfully`);
          
          return { type, content: output, success: true };
          
        } catch (error) {
          console.error(`❌ Failed to generate ${type}:`, error);
          
          return { 
            type, 
            content: null, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
    
    if (failures.length > 0) {
      console.error('❌ Some content types failed:', failures);
    }

    // Build generated content object
    const generatedContent: Record<string, any> = {};
    const successfulTypes: string[] = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        generatedContent[result.value.type] = result.value.content;
        successfulTypes.push(result.value.type);
      }
    });

    // If ALL content types failed, return error
    if (successfulTypes.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to generate any content', 
        details: 'All content generation attempts failed' 
      }, { status: 500 });
    }

    // Save to database
    const { data: studyKit, error: dbError } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title: prompt.slice(0, 100),
        source_type: fileName ? 'file' : 'text',
        source_content: prompt,
        file_name: fileName || null,
        content_types: successfulTypes, // Only save successful ones
        generated_content: generatedContent,
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    console.log(`✅ Study kit created: ${studyKit.id}`);

    return NextResponse.json({ 
      success: true, 
      id: studyKit.id, 
      content: generatedContent,
      partialSuccess: successfulTypes.length < contentTypes.length,
      successfulTypes,
    });

  } catch (error: any) {
    console.error('❌ Study Kit POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate study kit', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('study_kit_content')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ studyKits: data });
    
  } catch (error: any) {
    console.error('❌ Study Kit GET Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch study kits', 
      details: error?.message 
    }, { status: 500 });
  }
}