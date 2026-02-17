import "@/lib/polyfills";
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import type { DetectedChapter, ChapterContent, DocumentAnalysis } from '@/types/chapters';

type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';
type NoteType = 'deepExplanation' | 'cheatsheet' | 'application' | 'tables';

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

function cleanMarkdown(text: string): string {
  let cleaned = text.trim();
  const mdMatch = cleaned.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/i);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1].trim();
  }
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

function buildPrompt(type: ContentType, context: string, itemCount?: number) {
  const count = itemCount || 10;
  const truncatedContext = context.slice(0, 3000);

  switch (type) {
    case 'quizzes':
      return `Topic/Content Source: "${truncatedContext}"\n\nGenerate EXACTLY ${count} high-quality multiple-choice questions.

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${count} questions. No more, no less.
- correctAnswer MUST be 0, 1, 2, or 3 (NOT 1-4!)
- 0 = first option, 1 = second option, 2 = third option, 3 = fourth option

IMPORTANT FOR MATH/SCIENCE TOPICS:
- Write mathematical expressions in plain text (e.g., "x^2 + 2x + 1" instead of LaTeX)
- Use words for operations when clearer (e.g., "the square root of 16" or "sqrt(16)")
- Avoid special Unicode math symbols that may break JSON
- For fractions, use "/" notation (e.g., "3/4" or "three-fourths")
- Keep all text ASCII-safe

Output ONLY JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"Easy"}]`;

    case 'flashcards':
      return `Topic/Content Source: "${truncatedContext}"\n\nGenerate EXACTLY ${count} professional flashcards that focus on key concepts, terminology, and critical insights.
Generate EXACTLY ${count} flashcards. No more, no less.
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
      return `Topic/Content Source: "${truncatedContext}"\n\n${MINDMAP_TEMPLATE}\nOutput ONLY JSON object.`;

    case 'notes':
      return `Topic/Content Source: "${truncatedContext}"\n\nGenerate comprehensive study notes in markdown format.`;

    default:
      return `Topic/Content Source: "${truncatedContext}"`;
  }
}

function buildNotePrompt(context: string, noteType: NoteType): string {
  const truncatedContext = context.slice(0, 4000);
  const template = NOTE_TEMPLATES[noteType];
  return `Topic/Content Source: "${truncatedContext}"\n\n${template}`;
}

async function generateChapterContent(
  chapter: DetectedChapter,
  contentTypes: ContentType[],
  itemCount?: number
): Promise<ChapterContent> {
  const chapterContent: ChapterContent = {
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary
  };

  const generationPromises = contentTypes.map(async (type) => {
    if (type === 'notes') {
      const noteTypes: NoteType[] = ['deepExplanation', 'cheatsheet', 'application', 'tables'];
      const systemPromptMap: Record<NoteType, string> = {
        deepExplanation: `You are a World-Class Learning Architect creating a Deep Explanation Note. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
        cheatsheet: `You are a World-Class Exam Coach creating a Plain-Language Cheatsheet. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
        application: `You are a Senior Industry Practitioner creating an Application Note with worked examples. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
        tables: `You are a Reference Designer creating a Tables Reference Note. Output ONLY Markdown text — NO JSON. Prioritize tables. Start directly with the markdown heading. No preamble.`,
      };

      const notePromises = noteTypes.map(async (noteType) => {
        const notePrompt = buildNotePrompt(chapter.sourceContext, noteType);
        const result = await generateWithRetry({
          prompt: notePrompt,
          systemPrompt: systemPromptMap[noteType],
          temperature: 0.7,
          maxTokens: 5000,
          model: 'llama-3.3-70b-versatile'
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

      return { notes: notesObj };
    }

    if (type === 'quizzes') {
      const result = await generateWithRetry({
        prompt: buildPrompt(type, chapter.sourceContext, itemCount || 10),
        systemPrompt: 'Output ONLY valid JSON with no extra text.',
        temperature: 0.7,
        maxTokens: 4000,
        model: 'llama-3.1-8b-instant'
      });
      return { quizzes: extractJSON(result.text, type) };
    }

    if (type === 'flashcards') {
      const result = await generateWithRetry({
        prompt: buildPrompt(type, chapter.sourceContext, itemCount || 10),
        systemPrompt: 'Output ONLY valid JSON with no extra text.',
        temperature: 0.7,
        maxTokens: 4000,
        model: 'llama-3.1-8b-instant'
      });
      return { flashcards: extractJSON(result.text, type) };
    }

    if (type === 'mindmaps') {
      const result = await generateWithRetry({
        prompt: buildPrompt(type, chapter.sourceContext),
        systemPrompt: 'Output ONLY valid JSON with no extra text.',
        temperature: 0.7,
        maxTokens: 3000,
        model: 'llama-3.1-8b-instant'
      });
      return { mindmaps: extractJSON(result.text, type) };
    }

    return {};
  });

  const results = await Promise.allSettled(generationPromises);
  
  results.forEach(r => {
    if (r.status === 'fulfilled') {
      Object.assign(chapterContent, r.value);
    }
  });

  return chapterContent;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      chapters,
      documentAnalysis,
      contentTypes,
      itemCount,
      title,
      sourceContent
    } = body;

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters provided' }, { status: 400 });
    }

    if (!contentTypes || !Array.isArray(contentTypes) || contentTypes.length === 0) {
      return NextResponse.json({ error: 'No content types specified' }, { status: 400 });
    }

    const chapterContents = await Promise.all(
      chapters.map((chapter: DetectedChapter) => 
        generateChapterContent(chapter, contentTypes, itemCount)
      )
    );

    const studyKitContent = {
      chapters: chapterContents,
      chaptersMeta: {
        detectedAt: new Date().toISOString(),
        detectionModel: 'llama-3.3-70b-versatile',
        userModified: true,
        documentAnalysis
      }
    };

    const { data: studyKit, error } = await supabase
      .from('study_kit_content')
      .insert({
        user_id: user.id,
        title: title || 'Study Kit with Chapters',
        source_type: 'text',
        source_content: sourceContent?.slice(0, 5000) || '',
        content_types: [...contentTypes, 'chapters'],
        generated_content: studyKitContent
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save study kit:', error);
      return NextResponse.json({ error: 'Failed to save study kit' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: studyKit.id,
      content: studyKitContent
    });

  } catch (error: any) {
    console.error('Chapter-based generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Generation failed' }, 
      { status: 500 }
    );
  }
}
