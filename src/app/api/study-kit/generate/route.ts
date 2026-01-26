

import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry, extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

// Updated Templates
const NOTES_TEMPLATE = `
Act as a World-Class Learning Architect. Your goal is to transform this document into a High-Leverage Study Kit (Cheat Sheet) for an extremely busy Executive/Student.

**CONSTRAINTS:**
1.  **Density over Volume**: Strictly maintain a 1:10 page ratio. If the input is 100 pages, the kit must be 10 pages max. Cut all fluff.
2.  **The 80/20 Principle**: Identify the 20% of concepts that will generate 80% of the exam results or business value.
3.  **Dopamine Formatting**: Use heavy bolding, Lucide-style icons (markdown emojis), and clean spacing. No walls of text.
4.  **Mental Models**: Don't just summarize; provide mental models and "Cheat Sheets". Focus on "How can I apply this today?" and "What is the professor most likely to ask?".
5.  **Active Recall**: End every major section with 3 'High-Stakes Questions' that force the user to think, not just read.

**OUTPUT STRUCTURE (Strict Markdown):**

# ⚡ [Topic Title]: The High-Leverage Cheat Sheet

## 🧠 1. The "Missing Lecture" (Core Mental Model)
*What professors usually don't say out loud. Focus on intuition.*
-   **The Anchor**: ONE sentence that explains the entire concept using a powerful analogy.
-   **Practical Application**: How can I apply this today in business/life?
-   **The "Feynman Block"**: Explain the single most confusing part of this topic simply.

## 🎯 2. The 80/20 Exam Predictor (High-Value Intel)
*Where 80% of the points are hiding.*
-   🛑 **The Trap**: The most common mistake students/professionals make.
-   🎯 **The Guaranteed Question**: The specific type of problem that appears on 90% of exams/scenarios.
-   🔮 **The Curveball**: A rare but high-value edge case to differentiate "A" students.

## ⚡ 3. The Universal Algorithm (Procedural Mastery)
*How to solve/apply this on autopilot.*
-   **Step 1**: Identification (How to know to use this).
-   **Step 2**: The Setup (Formula/Mental Framework).
-   **Step 3**: The Execution (Step-by-step process).
-   **Step 4**: Sanity Check (How to verify the result).

## 📊 4. Comparison Cheat Sheets (1:10 Density)
*Pure signal, no noise. High-density tables.*
-   Create a table comparing critical opposing concepts (e.g., Concept A vs Concept B).
-   **Rule**: Keywords only. No full sentences in cells.

## 🚀 5. High-Stakes Active Recall
*Force thinking, not reading.*
1. [High-Stakes Scenario Question 1]
2. [High-Stakes Scenario Question 2]
3. [High-Stakes Scenario Question 3]

**FORMATTING RULES:**
- Use emojis (🛑, 🎯, 🔮, ⚡, 🧠, 📊, 🚀) as visual anchors.
- **Bold** every key term.
- Use > Blockquotes for "Executive Takeaways".
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

function extractContextForType(type: ContentType, fullPrompt: string): string {
  // Smart context extraction - only include relevant parts for each type
  const maxLength = 1500; // characters, not tokens

  if (fullPrompt.length <= maxLength) return fullPrompt;

  // For long prompts, extract key information based on content type
  switch (type) {
    case 'quizzes':
      // Focus on facts, definitions, key concepts
      return `Key concepts and facts to test: ${fullPrompt.substring(0, maxLength)}...`;
    case 'flashcards':
      // Focus on terms and definitions
      return `Important terms and concepts: ${fullPrompt.substring(0, maxLength)}...`;
    case 'mindmaps':
      // Focus on structure and relationships
      return `Topic structure and relationships: ${fullPrompt.substring(0, maxLength)}...`;
    case 'notes':
      // Can use more context for strategic notes
      return fullPrompt.substring(0, 3000);
    default:
      return fullPrompt.substring(0, maxLength);
  }
}

function buildPrompt(type: ContentType, prompt: string, isAppend: boolean = false, customInstructions: string = '', itemCount?: number, notesDepth?: string) {
  // Use extracted context instead of full prompt
  const contextualPrompt = extractContextForType(type, prompt);
  const base = `Topic/Content Source: "${contextualPrompt}"\n\n`;
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
        const contextSummaries = await extractContextFromText(extractedText);

        // If it's a small file (one chunk), use traditional logic
        if (contextSummaries.length === 1) {
          finalPrompt = `Based on the following extracted document context (${fileName}):\n\n${contextSummaries[0]}\n\nUser Context: ${prompt || 'Generate study materials'}\n\nIMPORTANT: Only generate content that is relevant to the provided document context.`;
        } else {
          // Store multiple chunks for parallel processing below
          (request as any).contextChunks = contextSummaries.map(summary =>
            `Based on document section (${fileName}):\n\n${summary}\n\nUser Context: ${prompt || 'Generate study materials'}`
          );
          finalPrompt = (request as any).contextChunks[0]; // Fallback for basic title use
        }
      } catch (err) {
        console.error('❌ File processing failed:', err);
      }
    }

    const typesToGenerate = appendType ? [appendType] : contentTypes;

    const results = await Promise.allSettled(
      typesToGenerate.map(async (type: ContentType) => {
        const isAppend = !!appendType;
        const chunks = (request as any).contextChunks || [finalPrompt];

        // Parallel batching for Quizzes and Flashcards across chunks
        if ((type === 'quizzes' || type === 'flashcards') && itemCount && itemCount > 10) {
          const batchSize = 10;
          const numBatches = Math.ceil(itemCount / batchSize);
          const batchPromises = [];

          for (let i = 0; i < numBatches; i++) {
            // Cycle through chunks to ensure coverage if multiple exist
            const chunkToUseNum = i % chunks.length;
            const currentChunk = chunks[chunkToUseNum];

            const currentBatchCount = Math.min(batchSize, itemCount - i * batchSize);
            batchPromises.push((async () => {
              const result = await generateWithRetry({
                prompt: buildPrompt(type, currentChunk, isAppend, '', currentBatchCount, notesDepth),
                systemPrompt: 'Output ONLY valid JSON with no extra text.',
                temperature: 0.7,
                maxTokens: 4000,
                model: 'llama-3.3-70b-versatile',
              });
              return extractJSON(result.text, type);
            })());
          }

          const batchResults = await Promise.all(batchPromises);
          const combinedContent = batchResults.flat();
          return { type, content: combinedContent };
        }

        // Parallel processing specifically for NOTES if multi-chunk
        if (type === 'notes' && chunks.length > 1) {
          const notePromises = chunks.map(async (chunk: string, i: number) => {
            const pageInfo = `\n\n**IMPORTANT CONTEXT:** This is Section/Page ${i + 1} of ${chunks.length} of the document. Focus on the content provided for this specific section while maintaining the "World-Class Learning Architect" persona. Ensure this "Cheat Sheet" is self-contained but contributes to the overall kit.`;
            
            const result = await generateWithRetry({
              prompt: buildPrompt(type, chunk, isAppend, customInstructions, itemCount, notesDepth) + pageInfo,
              systemPrompt: `You are an expert academic note-taker and Learning Architect. Create section ${i + 1} of ${chunks.length} of the study guide.
              
              CRITICAL RULES:
              1. Output ONLY Markdown text
              2. DO NOT use code blocks unless the topic is specifically about programming
              3. Start with a header: "## Chapter ${i + 1}: [Strategic Subject Focus]"
              4. Maintain the "Cheat Sheet" style: Bionic bolding, 80/20 principle, and Active Recall.
              5. Ensure high density (1:10 ratio).`,
              temperature: 0.7,
              maxTokens: 5000,
              model: 'llama-3.3-70b-versatile',
            });
            return cleanMarkdown(result.text);
          });

          const noteResults = await Promise.all(notePromises);
          return { type, content: noteResults };
        }

        // Standard generation for other types or single batch
        const result = await generateWithRetry({
          prompt: buildPrompt(type, chunks[0], isAppend, type === 'notes' ? customInstructions : '', itemCount, notesDepth),
          systemPrompt: type === 'notes'
            ? `You are a World-Class Learning Architect. Your goal is to transform documents into High-Leverage Study Kits for extremely busy Executives/Students.
              
              CRITICAL RULES:
              1. Output ONLY Markdown text - NO JSON
              2. DO NOT use code blocks (backticks) unless the topic is specifically about programming
              3. For math/science topics, write formulas in plain text like "F = m × a" or "x^2 + 2x + 1"
              4. Use "Dopamine Formatting": Heavy bolding, emoji icons, and Radix-clean spacing
              5. Density over Volume: Strictly maintain a 1:10 page ratio. Cut all fluff.
              6. Identify the 20% of concepts that generate 80% of value.
              
              Start directly with the markdown heading. No preamble.`
            : 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: type === 'notes' ? 6000 : 4000,
          model: 'llama-3.3-70b-versatile',
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