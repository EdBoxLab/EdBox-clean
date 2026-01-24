

import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry, extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

// Updated Templates
const NOTES_TEMPLATE = `
Generate comprehensive, professionally structured study notes that are DETAILED and HIGHLY USEFUL for students.

CRITICAL: These notes must be SUBSTANTIAL and THOROUGH - at least 2500 words minimum. Do NOT generate basic, surface-level summaries.

**ABSOLUTELY CRITICAL - CODE RULES:**
- NEVER include programming code (JavaScript, Python, Java, etc.) unless the topic is SPECIFICALLY about programming, software development, or computer science
- For math/science/history/business topics: NO code examples, NO function definitions, NO React components
- If you need to show a calculation, write it in plain text or mathematical notation, NOT as code
- Example of what NOT to do for non-programming topics: \`\`\`javascript or function example()
- Example of what TO do: "Calculate using the formula: x = (b ± √(b² - 4ac)) / 2a"

Use Markdown formatting. Structure as follows:

# [Topic Title]

## Overview
Provide a comprehensive introduction (3-4 paragraphs) explaining what this topic is, why it matters, and how it connects to broader concepts. Include real-world relevance and historical context if applicable.

## Core Concepts
For EACH major concept:
### [Concept Name]
- **Definition**: Clear, precise explanation
- **Detailed Breakdown**: Use multiple bullet points to explain nuances
- **How It Works**: Step-by-step explanation of processes or mechanisms
- **Formulas/Notation**: Use plain text mathematical expressions (e.g., "x^2 + 2x + 1" or "Force = mass × acceleration")
- **Example**: Concrete illustration using prose and calculations, NOT code

## Examples & Use Cases
Provide 4-6 detailed, practical examples that show the concept in action. Include:
- Real-world scenarios
- Detailed walkthroughs of how to solve related problems
- Step-by-step calculations or reasoning (in plain text)
- Visual descriptions or diagrams represented in text

## Deep Dive
Advanced details including:
- Edge cases and exceptions
- Performance considerations or advanced theoretical implications
- Best practices and expert-level insights
- Related advanced concepts and future trends

## High-Impact Study Tables
Analyze the content and generate 2-3 deep-dive tables that aggregate dispersed information.
Choose the most appropriate structure:
- **Comparative Analysis**: [Concept A] vs [Concept B] (Criteria: Definition, Function, Key Differences)
- **Chronological Breakdown**: Event | Date | Significance | Outcome
- **Process Flow**: Step | Action | Technical Detail | Result
- **Component Analysis**: Component | Function | Interactions | Key Properties

CRITICAL: Tables must be dense with information, replacing the need to read paragraphs.
Format as standard Markdown tables with aligned columns.
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |

## Key Takeaways
- Comprehensive bulleted summary (10-15 key points)
- Each takeaway should be actionable, specific, and memorable

## Quick Reference & Cheat Sheet
Provide a summary of the most important formulas, terms, or concepts in an easy-to-scan format. Use tables or lists, NOT code blocks.

REMEMBER: Output pure Markdown text. NO code blocks unless the topic is programming-related!
`;

const MINDMAP_TEMPLATE = `
Generate a structured, hierarchical mind map of the topic.
The mind map should be beautifully organized and logically consistent.

Format as a strict JSON object with a central node and branches:
{
  "central": "Main Topic Name",
  "branches": [
    {
      "topic": "Major Category",
      "subtopics": ["Sub-point 1", "Sub-point 2", "Sub-point 3"],
      "details": "Extremely detailed information about this category, including definitions, examples, and key insights that appear when the user clicks this node."
    }
  ]
}
`;

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

/**
 * Clean Markdown response by removing wrapping code blocks if the AI accidentally added them
 */
function cleanMarkdown(text: string): string {
  let cleaned = text.trim();

  // Remove wrapping markdown code blocks if present
  // Matches: ```markdown [content] ``` or ``` [content] ```
  const mdMatch = cleaned.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/i);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1].trim();
  }

  // Also handle cases where it might just start with ``` and end with ``` without newlines
  const mdMatchSimple = cleaned.match(/^```(?:markdown)?([\s\S]*?)```$/i);
  if (mdMatchSimple && mdMatchSimple[1]) {
    return mdMatchSimple[1].trim();
  }

  return cleaned;
}

function extractJSON(text: string, type: ContentType) {
  try {
    let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');

    cleaned = cleaned
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\\n/g, ' ')
      .replace(/\r?\n/g, ' ');

    const start = cleaned.indexOf(type === 'mindmaps' ? '{' : '[');
    const end = cleaned.lastIndexOf(type === 'mindmaps' ? '}' : ']');

    if (start === -1 || end === -1) {
      if (type !== 'mindmaps') {
        const altStart = cleaned.indexOf('{');
        const altEnd = cleaned.lastIndexOf('}');
        if (altStart !== -1 && altEnd !== -1) {
          const possibleObj = cleaned.substring(altStart, altEnd + 1);
          try {
            const parsedObj = JSON.parse(possibleObj);
            const arrayKey = Object.keys(parsedObj).find(key => Array.isArray(parsedObj[key]));
            if (arrayKey) return parsedObj[arrayKey];
          } catch (e) { }
        }
      }
      throw new Error('No valid JSON structure found in AI response');
    }

    cleaned = cleaned.substring(start, end + 1);
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      cleaned = cleaned.replace(/\\(?!["\\])/g, '\\\\').replace(/[\u0000-\u001F]/g, '');
      try {
        parsed = JSON.parse(cleaned);
      } catch (secondError) {
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
    throw new Error(`Failed to parse ${type}: ${error}`);
  }
}

function isProgrammingTopic(prompt: string): boolean {
  const programmingKeywords = [
    'code', 'programming', 'javascript', 'python', 'java', 'react', 'component',
    'function', 'algorithm', 'software', 'development', 'web development',
    'api', 'database', 'frontend', 'backend', 'typescript', 'html', 'css',
    'node', 'angular', 'vue', 'coding', 'developer', 'syntax', 'variable',
    'array', 'object', 'class', 'method', 'loop', 'conditional'
  ];

  const lowerPrompt = prompt.toLowerCase();
  return programmingKeywords.some(keyword => lowerPrompt.includes(keyword));
}

function buildPrompt(type: ContentType, prompt: string, isAppend: boolean = false, customInstructions: string = '', itemCount?: number, notesDepth?: string) {
  const base = `Topic/Content Source: "${prompt}"\n\n`;
  const count = itemCount || (isAppend ? 10 : 15);

  switch (type) {
    case 'quizzes':
      return base + `Generate EXACTLY ${count} high-quality multiple-choice questions.

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${count} questions. No more, no less.
- The output must be a single continuous set of ${count} questions.
- correctAnswer MUST be 0, 1, 2, or 3 (NOT 1-4!)
- 0 = first option
- 1 = second option  
- 2 = third option
- 3 = fourth option

IMPORTANT FOR MATH/SCIENCE TOPICS:
- Write mathematical expressions in plain text (e.g., "x^2 + 2x + 1" instead of LaTeX)
- Use words for operations when clearer (e.g., "the square root of 16" or "sqrt(16)")
- Avoid special Unicode math symbols that may break JSON
- For fractions, use "/" notation (e.g., "3/4" or "three-fourths")
- Keep all text ASCII-safe

CRITICAL: correctAnswer is 0-indexed (0=first option, 3=fourth option)
Output ONLY JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"Easy"}]`;

    case 'flashcards':
      return base + `Generate EXACTLY ${count} professional flashcards that focus on key concepts, terminology, and critical insights.
Generate EXACTLY ${count} flashcards. No more, no less.
The output must be a single continuous set of ${count} flashcards.
Avoid one-word answers; provide clear, descriptive definitions.
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
\nOutput ONLY JSON array.`;

    case 'mindmaps':
      return base + MINDMAP_TEMPLATE + '\nOutput ONLY JSON object.';

    case 'notes':
      const isCodeRelated = isProgrammingTopic(prompt);
      let depthInstructions = '';

      switch (notesDepth) {
        case 'summary':
          depthInstructions = 'Focus: High-level overview. Provide a concise but comprehensive summary of the key points.';
          break;
        case 'deepdive':
          depthInstructions = 'Focus: Deep Dive. Provide detailed explanations, intricate nuances, and in-depth analysis of every aspect.';
          break;
        case 'coverage':
          depthInstructions = 'Focus: Balanced mix of breadth and depth. Ensure all major topics are covered with sufficient detail.';
          break;
        case 'shi':
          depthInstructions = 'Focus: SHI Mode (Experimental). Provide a creative, unconventional, and highly engaging perspective. Use analogies, storytelling, and unique insights while maintaining academic accuracy.';
          break;
        default:
          depthInstructions = 'Focus: Comprehensive coverage.';
      }

      let notesPrompt = base + depthInstructions + '\n\n' + NOTES_TEMPLATE;

      if (!isCodeRelated) {
        notesPrompt += `\n\n**EXTRA CRITICAL REMINDER FOR THIS TOPIC:**
This topic ("${prompt}") is NOT about programming or software development.
Therefore, you MUST NOT include ANY code examples, function definitions, or programming syntax.
Use plain text explanations, mathematical notation, and prose examples only.
Any code-like syntax will be considered an error.`;
      }

      if (customInstructions) {
        notesPrompt += `\n\nCUSTOM INSTRUCTIONS FOR THESE NOTES: ${customInstructions}\nIMPORTANT: Please follow these details strictly.`;
      }
      return notesPrompt;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { prompt, contentTypes, fileName, fileContent, fileType, kitId, appendType, customInstructions, itemCount, notesDepth } = body;

    let finalPrompt = prompt || '';
    let existingKit = null;

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

    if ((!finalPrompt && !fileContent) && !kitId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (fileContent && !kitId) {
      try {
        const extractedText = await processFileContent(fileContent, fileType || '', fileName || '');
        const contextSummary = await extractContextFromText(extractedText);
        finalPrompt = `Based on the following extracted document context (${fileName}):\n\n${contextSummary}\n\nUser Context: ${prompt || 'Generate study materials'}\n\nIMPORTANT: Only generate content that is relevant to the provided document context.`;
      } catch (err) {
        console.error('❌ File processing failed:', err);
      }
    }

    const typesToGenerate = appendType ? [appendType] : contentTypes;

    const results = await Promise.allSettled(
      typesToGenerate.map(async (type: ContentType) => {
        const isAppend = !!appendType;

        // Parallel batching for Quizzes and Flashcards (batches of 10)
        if ((type === 'quizzes' || type === 'flashcards') && itemCount && itemCount > 10) {
          const batchSize = 10;
          const numBatches = Math.ceil(itemCount / batchSize);
          const batchPromises = [];

          for (let i = 0; i < numBatches; i++) {
            const currentBatchCount = Math.min(batchSize, itemCount - i * batchSize);
            batchPromises.push((async () => {
              const result = await generateWithRetry({
                prompt: buildPrompt(type, finalPrompt, isAppend, '', currentBatchCount, notesDepth),
                systemPrompt: 'Output ONLY valid JSON with no extra text.',
                temperature: 0.7,
                maxTokens: 4000,
                model: 'oss',
              });
              return extractJSON(result.text, type);
            })());
          }

          const batchResults = await Promise.all(batchPromises);
          // Combine all batches into a single array
          const combinedContent = batchResults.flat();
          return { type, content: combinedContent };
        }

        // Standard generation for other types or single batch
        const result = await generateWithRetry({
          prompt: buildPrompt(type, finalPrompt, isAppend, type === 'notes' ? customInstructions : '', itemCount, notesDepth),
          systemPrompt: type === 'notes'
            ? `You are an expert academic note-taker. Create structured, detailed, and clear study notes in Markdown format.

CRITICAL RULES:
1. Output ONLY Markdown text - NO JSON
2. DO NOT use code blocks (backticks) unless the topic is specifically about programming
3. For math/science topics, write formulas in plain text like "F = m × a" or "x^2 + 2x + 1"
4. Use prose, tables, lists, and text formatting - NOT code examples
5. If the topic is NOT programming-related, absolutely NO JavaScript/Python/code of any kind

Start directly with the markdown heading. No preamble.`
            : 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: type === 'notes' ? 6000 : 4000,
          model: type === 'notes' ? 'versatile' : 'oss',
        });

        const output = type === 'notes' ? cleanMarkdown(result.text) : extractJSON(result.text, type);
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
      return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }

    if (kitId && existingKit) {
      const updatedGeneratedContent = { ...existingKit.generated_content };

      if (appendType) {
        const existingList = Array.isArray(updatedGeneratedContent[appendType]) ? updatedGeneratedContent[appendType] : [];
        const newList = Array.isArray(generatedContent[appendType]) ? generatedContent[appendType] : [];
        updatedGeneratedContent[appendType] = [...existingList, ...newList];
      } else {
        Object.keys(generatedContent).forEach(key => {
          updatedGeneratedContent[key] = generatedContent[key];
        });
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

      return NextResponse.json({
        success: true,
        id: updatedKit?.id,
        content: updatedGeneratedContent
      });
    }

    let title = prompt?.slice(0, 100) || fileName?.split('.')[0] || 'Study Kit';
    if (title.length < 3) title = 'My Study Kit';

    const { data: studyKit } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title: title,
        source_type: fileName ? 'file' : 'text',
        source_content: finalPrompt.substring(0, 5000),
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