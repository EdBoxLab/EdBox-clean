

import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry, extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';
import { detectChapters, detectChaptersFromLargeFile } from '@/lib/chapter-detection';
import type { DetectedChapter, ChapterContent } from '@/types/chapters';
import { getRateLimiter } from '@/lib/rate-limit';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';

type NoteType = 'deepExplanation' | 'cheatsheet' | 'application' | 'tables';

const LARGE_FILE_THRESHOLD = 100000;

const NOTE_TEMPLATES: Record<NoteType, string> = {
  deepExplanation: `
Act as a World-Class Learning Architect. Create a **Deep Explanation Note** that is so thorough the student never needs to touch the source material again.

**CONSTRAINTS:**
1. **Completeness**: Cover every concept, definition, and relationship. Leave no gaps.
2. **Feynman-Style Clarity**: Explain complex ideas so simply a 12-year-old could understand.
3. **Analogies & Mental Models**: For every abstract concept, provide a concrete real-world analogy.
4. **Prerequisites Built In**: If a concept requires prior knowledge, briefly explain that too.
5. **Dopamine Formatting**: Heavy bolding, emojis as visual anchors, clean spacing.

**OUTPUT STRUCTURE (Strict Markdown):**

# 📖 [Topic Title]: The Complete Breakdown

## 🧠 The Big Picture
*A 3-4 paragraph overview explaining what this topic IS, why it matters, and how it fits into the bigger picture. Use an analogy to ground it.*

## 🔑 Core Concepts Explained
*For EACH major concept:*
### [Concept Name]
- **What it is (Simple)**: One-sentence Feynman explanation.
- **What it is (Precise)**: The formal/textbook definition.
- **The Analogy**: A real-world comparison that makes it click.
- **How it works**: Step-by-step breakdown of the mechanism/process.
- **Why it matters**: The "so what?" — why should you care?
- **Common Confusion**: What people usually get wrong about this.

## 🔗 How Everything Connects
*Explain the relationships between the core concepts. How does Concept A lead to Concept B? What depends on what?*

## 💡 The "Aha!" Moments
*3-5 insights that transform surface-level understanding into deep comprehension.*

## 🧪 Thought Experiments
*2-3 scenarios that test whether the reader truly understands (not memorized) the material.*

**FORMATTING RULES:**
- Use emojis (📖, 🧠, 🔑, 🔗, 💡, 🧪) as visual anchors.
- **Bold** every key term on first use.
- Use > Blockquotes for critical insights.
`,

  cheatsheet: `
Act as a World-Class Exam Coach. Create a **Plain-Language Cheatsheet** focused on what actually appears on tests and exams.

**CONSTRAINTS:**
1. **No Jargon**: Write in plain, understandable terms. If you use a technical term, immediately explain it.
2. **Exam-Focused**: Every line should answer "Will this be on the test?"
3. **The 80/20 Principle**: The 20% of material that covers 80% of exam questions.
4. **Memorization Aids**: Mnemonics, shortcuts, patterns.
5. **Density over Volume**: 1:10 page ratio. Pure signal.

**OUTPUT STRUCTURE (Strict Markdown):**

# 🎯 [Topic Title]: Exam Cheatsheet

## 🛑 The #1 Trap (Most Common Mistake)
*The specific error that loses students the most points. Explain what it is and how to avoid it.*

## 📋 Must-Know Definitions
*Every definition a professor could ask. Format:*
- **[Term]**: [Plain-language definition] → *"In other words..."*

## ⚡ Formulas & Key Relationships
*Every formula/rule you need. For each:*
- The formula itself
- What each variable means (in plain words)
- When to use it (the trigger/signal)

## 🎯 The "Guaranteed" Question Types
*The 3-5 question patterns that appear on almost every exam. For each:*
1. **What it looks like**: How to recognize this question type
2. **The approach**: Step-by-step how to solve it
3. **The shortcut**: Any time-saving tricks

## 🧠 Memory Hacks
*Mnemonics, acronyms, rhymes, or visual tricks to remember key facts.*

## 🔮 The Curveball
*1-2 rare but high-value edge cases that separate A students from B students.*

## ✅ Last-Minute Checklist
*10-15 bullet points to review 5 minutes before the exam.*

**FORMATTING RULES:**
- Use emojis (🛑, 📋, ⚡, 🎯, 🧠, 🔮, ✅) as visual anchors.
- **Bold** every key term.
- Keep it scannable — a student should find any fact in under 5 seconds.
`,

  application: `
Act as a Senior Industry Practitioner and Professor. Create an **Application Note** focused on real-world usage and worked examples.

**CONSTRAINTS:**
1. **Practical Focus**: Every section must answer "How is this used in real life?"
2. **Fully Worked Examples**: Show complete problem-solving, step by step.
3. **Decision Trees**: Help students know WHEN to apply WHICH concept.
4. **Industry Relevance**: Connect academic concepts to career applications.
5. **Dopamine Formatting**: Heavy bolding, emojis, clean spacing.

**OUTPUT STRUCTURE (Strict Markdown):**

# 🔧 [Topic Title]: Real-World Applications

## 🌍 Where This Shows Up in the Real World
*3-5 concrete examples of industries, jobs, or situations where this knowledge is used daily.*

## 🛠️ Worked Examples
*For EACH major concept, provide a fully worked problem:*
### Example: [Scenario Name]
- **The Situation**: Describe a realistic scenario
- **What We Know**: List the given information
- **Step-by-Step Solution**: Walk through every step with explanations
- **The Answer**: Clear final result
- **Why This Matters**: What this example teaches us

## 🗺️ The Decision Tree
*"When should I use what?" — A clear guide:*
- **If you see [signal]** → Use [concept/formula/approach]
- **If you see [different signal]** → Use [different approach]

## 💼 Career Connections
*How this topic applies in specific careers (engineering, business, research, etc.)*

## 🏋️ Practice Scenarios
*3-5 problems for the student to try on their own, with varying difficulty. Include hints.*

**FORMATTING RULES:**
- Use emojis (🔧, 🌍, 🛠️, 🗺️, 💼, 🏋️) as visual anchors.
- **Bold** key terms and important numbers in examples.
- Use > Blockquotes for "Pro Tips" from industry experience.
`,

  tables: `
Act as a Data Architect and Reference Designer. Create a **Tables Reference Note** — pure high-density comparison data and reference tables.

**CONSTRAINTS:**
1. **Tables Only (Mostly)**: This note is primarily structured data in table format.
2. **Comparison-First**: Compare and contrast related concepts side-by-side.
3. **Keywords Only in Cells**: No full sentences inside table cells.
4. **Complete Coverage**: Every important comparison, formula, or term should be in a table.
5. **Scannable**: A student should find any fact in under 3 seconds.

**OUTPUT STRUCTURE (Strict Markdown):**

# 📊 [Topic Title]: Quick Reference Tables

## ⚔️ Concept Comparisons
*Create comparison tables for every pair/group of related concepts:*

| Feature | Concept A | Concept B | Concept C |
|---------|-----------|-----------|-----------|
| Definition | ... | ... | ... |
| Key Property | ... | ... | ... |
| When to Use | ... | ... | ... |
| Pros | ... | ... | ... |
| Cons | ... | ... | ... |

## 📐 Formula Sheet
*Every formula/equation in a clean reference table:*

| Name | Formula | Variables | Use When |
|------|---------|-----------|----------|
| ... | ... | ... | ... |

## 📖 Glossary
*All key terms in alphabetical order:*

| Term | Definition | Related To |
|------|-----------|------------|
| ... | ... | ... |

## 🔢 Key Facts & Figures
*Important numbers, dates, constants, or thresholds:*

| Fact | Value | Context |
|------|-------|---------|
| ... | ... | ... |

## 🗂️ Classification / Taxonomy
*If applicable, organize concepts into categories:*

| Category | Members | Key Characteristic |
|----------|---------|-------------------|
| ... | ... | ... |

## ⚡ Quick-Lookup Cheat Table
*The single most useful reference table — the one you'd print on a single page:*

**FORMATTING RULES:**
- Prioritize tables over prose.
- Use emojis (📊, ⚔️, 📐, 📖, 🔢, 🗂️, ⚡) as section markers.
- **Bold** column headers and key terms.
- Keep cell content to 1-5 words max.
`
};

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
      return buildNotePrompt(prompt, notesDepth, customInstructions);
  }
}

function buildNotePrompt(prompt: string, notesDepth?: string, customInstructions?: string, noteType?: NoteType): string {
  const contextualPrompt = extractContextForType('notes', prompt);
  const base = `Topic/Content Source: "${contextualPrompt}"\n\n`;
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

  const template = noteType ? NOTE_TEMPLATES[noteType] : NOTE_TEMPLATES.deepExplanation;
  let notesPrompt = base + depthInstructions + '\n\n' + template;

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

async function generateChapterContent(
  chapter: DetectedChapter,
  contentTypes: string[],
  customInstructions?: string,
  itemCount?: number,
  notesDepth?: string
): Promise<ChapterContent> {
  const chapterContext = chapter.sourceContext || '';
  const chapterPrompt = `Chapter: ${chapter.title}\n\nSummary: ${chapter.summary}\n\nKey Topics: ${chapter.keyTopics.join(', ')}\n\nLearning Objectives: ${chapter.learningObjectives.join(', ')}\n\nContent:\n${chapterContext}`;

  const result: ChapterContent = {
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary
  };

  const warnings: string[] = [];

  // Helper: generate a single content type with logging
  async function generateSingleType(typeLabel: string, fn: () => Promise<any>): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    try {
      await fn();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ✅ [${chapter.title}] ${typeLabel} generated in ${elapsed}s`);
      return { success: true };
    } catch (error: any) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`  ❌ [${chapter.title}] ${typeLabel} FAILED after ${elapsed}s:`, error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // --- Phase 1: Fire all content types in parallel ---
  console.log(`\n📖 Generating content for chapter: "${chapter.title}" (${contentTypes.join(', ')})`);
  const phase1Start = Date.now();

  const phase1Tasks: { label: string; run: () => Promise<any> }[] = [];

  if (contentTypes.includes('quizzes')) {
    phase1Tasks.push({
      label: 'quizzes',
      run: async () => {
        const quizResult = await generateWithRetry({
          prompt: buildPrompt('quizzes', chapterPrompt, false, '', itemCount || 5, notesDepth),
          systemPrompt: 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: 4000,
          model: 'llama-3.3-70b-versatile'
        });
        result.quizzes = extractJSON(quizResult.text, 'quizzes');
      }
    });
  }

  if (contentTypes.includes('flashcards')) {
    phase1Tasks.push({
      label: 'flashcards',
      run: async () => {
        const flashcardResult = await generateWithRetry({
          prompt: buildPrompt('flashcards', chapterPrompt, false, '', itemCount || 10, notesDepth),
          systemPrompt: 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: 4000,
          model: 'llama-3.3-70b-versatile'
        });
        result.flashcards = extractJSON(flashcardResult.text, 'flashcards');
      }
    });
  }

  if (contentTypes.includes('mindmaps')) {
    phase1Tasks.push({
      label: 'mindmaps',
      run: async () => {
        const mindmapResult = await generateWithRetry({
          prompt: buildPrompt('mindmaps', chapterPrompt, false, '', itemCount, notesDepth),
          systemPrompt: 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: 4000,
          model: 'llama-3.3-70b-versatile'
        });
        result.mindmaps = extractJSON(mindmapResult.text, 'mindmaps');
      }
    });
  }

  if (contentTypes.includes('notes')) {
    const noteTypes: NoteType[] = ['deepExplanation', 'cheatsheet', 'application', 'tables'];
    const systemPromptMap: Record<NoteType, string> = {
      deepExplanation: `You are a World-Class Learning Architect creating a Deep Explanation Note. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
      cheatsheet: `You are a World-Class Exam Coach creating a Plain-Language Cheatsheet. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
      application: `You are a Senior Industry Practitioner creating an Application Note with worked examples. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
      tables: `You are a Reference Designer creating a Tables Reference Note. Output ONLY Markdown text — NO JSON. Prioritize tables. Start directly with the markdown heading. No preamble.`
    };

    if (!result.notes) result.notes = { deepExplanation: '', cheatsheet: '', application: '', tables: '' };

    for (const noteType of noteTypes) {
      phase1Tasks.push({
        label: `notes/${noteType}`,
        run: async () => {
          const notePrompt = buildNotePrompt(chapterPrompt, notesDepth, customInstructions, noteType);
          const noteResult = await generateWithRetry({
            prompt: notePrompt,
            systemPrompt: systemPromptMap[noteType],
            temperature: 0.7,
            maxTokens: 5000,
            model: 'llama-3.3-70b-versatile'
          });
          result.notes![noteType] = cleanMarkdown(noteResult.text);
        }
      });
    }
  }

  // Run all tasks in parallel
  const phase1Results = await Promise.allSettled(
    phase1Tasks.map(task => generateSingleType(task.label, task.run))
  );

  // Collect failures for retry
  const failedTasks: typeof phase1Tasks = [];
  phase1Results.forEach((settledResult, i) => {
    const taskResult = settledResult.status === 'fulfilled' ? settledResult.value : { success: false, error: 'Promise rejected' };
    if (!taskResult.success) {
      failedTasks.push(phase1Tasks[i]);
    }
  });

  const phase1Elapsed = ((Date.now() - phase1Start) / 1000).toFixed(1);
  console.log(`  📊 [${chapter.title}] Phase 1 complete in ${phase1Elapsed}s — ${phase1Tasks.length - failedTasks.length}/${phase1Tasks.length} succeeded`);

  // --- Phase 2: Retry failed types sequentially (avoids rate limit stacking) ---
  if (failedTasks.length > 0) {
    console.log(`  🔄 [${chapter.title}] Retrying ${failedTasks.length} failed type(s) sequentially...`);

    for (const task of failedTasks) {
      const retryResult = await generateSingleType(`${task.label} (retry)`, task.run);
      if (!retryResult.success) {
        warnings.push(`${task.label} could not be generated for "${chapter.title}": ${retryResult.error}`);
      }
    }
  }

  // Attach warnings to result
  (result as any).warnings = warnings;
  if (warnings.length > 0) {
    console.warn(`  ⚠️ [${chapter.title}] Completed with ${warnings.length} warning(s):`);
    warnings.forEach(w => console.warn(`     - ${w}`));
  } else {
    console.log(`  ✨ [${chapter.title}] All content generated successfully!`);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ratelimit = getRateLimiter();
    if (ratelimit) {
      const identifier = user.id;
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

      if (!success) {
        const resetDate = new Date(reset);
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        
        console.warn(`⚠️ Rate limit exceeded for user ${user.id}. Remaining: ${remaining}/${limit}. Reset: ${resetDate.toISOString()}`);
        
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

      console.log(`✅ Rate limit check passed for user ${user.id}. Remaining: ${remaining}/${limit}`);
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

    if (useChapters && !confirmedChapters && extractedText) {
      const textSize = extractedText.length;
      let chapterResult;

      if (textSize > LARGE_FILE_THRESHOLD) {
        chapterResult = await detectChaptersFromLargeFile(extractedText, {
          maxChapters: 12,
          minChapterLength: 2000
        });
      } else {
        chapterResult = await detectChapters(extractedText);
      }

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
      const chapterContents: ChapterContent[] = [];
      const typesToGenerate = contentTypes || ['quizzes', 'flashcards', 'mindmaps', 'notes'];
      const totalStart = Date.now();
      const allWarnings: string[] = [];

      console.log(`\n🚀 Starting chapter-based generation: ${confirmedChapters.length} chapter(s), types: [${typesToGenerate.join(', ')}]`);

      for (let i = 0; i < (confirmedChapters as DetectedChapter[]).length; i++) {
        const chapter = (confirmedChapters as DetectedChapter[])[i];
        console.log(`\n━━━ Chapter ${i + 1}/${confirmedChapters.length}: "${chapter.title}" ━━━`);
        const chapterContent = await generateChapterContent(chapter, typesToGenerate, customInstructions, itemCount, notesDepth);
        chapterContents.push(chapterContent);
        if ((chapterContent as any).warnings?.length > 0) {
          allWarnings.push(...(chapterContent as any).warnings);
        }
      }

      const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
      console.log(`\n🏁 All chapters complete in ${totalElapsed}s — ${allWarnings.length} total warning(s)`);
      if (allWarnings.length > 0) {
        allWarnings.forEach(w => console.warn(`  ⚠️ ${w}`));
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
          content_types: typesToGenerate,
          generated_content: { chapters: chapterContents },
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        id: studyKit?.id,
        content: { chapters: chapterContents },
        hasChapters: true
      });
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

        // Generate 4 parallel note types when 'notes' is selected
        if (type === 'notes') {
          const noteTypes: NoteType[] = ['deepExplanation', 'cheatsheet', 'application', 'tables'];
          const chunk = chunks[0];

          const notePromises = noteTypes.map(async (noteType) => {
            const notePrompt = buildNotePrompt(chunk, notesDepth, customInstructions, noteType);
            const systemPromptMap: Record<NoteType, string> = {
              deepExplanation: `You are a World-Class Learning Architect creating a Deep Explanation Note. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
              cheatsheet: `You are a World-Class Exam Coach creating a Plain-Language Cheatsheet. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
              application: `You are a Senior Industry Practitioner creating an Application Note with worked examples. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
              tables: `You are a Reference Designer creating a Tables Reference Note. Output ONLY Markdown text — NO JSON. Prioritize tables. Start directly with the markdown heading. No preamble.`,
            };

            const result = await generateWithRetry({
              prompt: notePrompt,
              systemPrompt: systemPromptMap[noteType],
              temperature: 0.7,
              maxTokens: 5000,
              model: 'llama-3.3-70b-versatile',
            });
            return { noteType, text: cleanMarkdown(result.text) };
          });

          const noteResults = await Promise.allSettled(notePromises);
          const notesObj: Record<string, string> = {};
          noteResults.forEach(r => {
            if (r.status === 'fulfilled') {
              notesObj[r.value.noteType] = r.value.text;
            }
          });
          return { type, content: notesObj };
        }

        // Standard generation for non-notes types
        const result = await generateWithRetry({
          prompt: buildPrompt(type, chunks[0], isAppend, '', itemCount, notesDepth),
          systemPrompt: 'Output ONLY valid JSON with no extra text.',
          temperature: 0.7,
          maxTokens: 4000,
          model: 'llama-3.3-70b-versatile',
        });

        const output = extractJSON(result.text, type);
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