import { NoteType } from './types';

export const LARGE_FILE_THRESHOLD = 100000;
export const FORCE_CHAPTER_THRESHOLD = 500000;

export const NOTE_TEMPLATES: Record<NoteType, string> = {
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

export const MINDMAP_TEMPLATE = `
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
