import { NoteType } from './types';

// ─── File Size Thresholds ────────────────────────────────────────────────────
// Kept deliberately conservative for serverless (60s timeout budget).
// LARGE_FILE_THRESHOLD  → switch to chunked chapter detection
// FORCE_CHAPTER_THRESHOLD → bypass single-pass and require chapter review before generation

export const LARGE_FILE_THRESHOLD = 50_000;      // ~50 KB of extracted text
export const FORCE_CHAPTER_THRESHOLD = 150_000;  // ~150 KB — too large for single-pass AI call

// ─── Generation Limits ──────────────────────────────────────────────────────
export const MAX_CHAPTER_CONCURRENCY = 3;   // p-limit cap: 3 chapters generating simultaneously
export const MAX_SOURCE_CONTENT_LENGTH = 5_000;
export const MAX_TITLE_LENGTH = 100;
export const MAX_CHAPTERS = 12;
export const MIN_CHAPTER_LENGTH = 2_000;

// ─── Note Templates ─────────────────────────────────────────────────────────
// Design principle: give the model the OUTPUT SKELETON, not meta-instructions about
// how smart it should be. The model already knows how to write. Every extra sentence
// of "Act as a World-Class X" is ~15 tokens of latency with zero quality benefit.
// These templates are ~250 tokens each vs the prior ~750 — same output, 3x less cost.

export const NOTE_TEMPLATES: Record<NoteType, string> = {
  deepExplanation: `
Create a **Deep Explanation Note** using this exact structure. Be thorough — the student should not need to return to the source material.

# 📖 [Topic Title]: The Complete Breakdown

## 🧠 The Big Picture
3–4 paragraphs: what this topic IS, why it matters, how it fits the broader domain.
Ground it with a concrete real-world analogy.

## 🔑 Core Concepts
For each major concept:
### [Concept Name]
- **Simple**: One-sentence plain-language explanation
- **Precise**: Formal/textbook definition
- **Analogy**: Real-world comparison
- **Mechanism**: Step-by-step how it works
- **Why it matters**: The practical "so what"
- **Common confusion**: What learners typically get wrong

## 🔗 How Everything Connects
Map the relationships: how does Concept A lead to B? What depends on what?

## 💡 The "Aha!" Moments
3–5 non-obvious insights that separate surface-level from deep understanding.

## 🧪 Thought Experiments
2–3 scenarios that test genuine understanding, not memorisation.

**Formatting**: Bold every key term on first use. Use > blockquotes for critical insights. Emoji headers as shown.
`,

  cheatsheet: `
Create a **Plain-Language Exam Cheatsheet** — the 20% of material that covers 80% of exam questions.

# 🎯 [Topic Title]: Exam Cheatsheet

## 🛑 The #1 Trap
The single most common mistake that loses students marks. What it is and how to avoid it.

## 📋 Must-Know Definitions
- **[Term]**: [plain-language definition] → *"In other words: ..."*

## ⚡ Formulas & Key Relationships
For each formula/rule: the formula itself | what each variable means | when to use it (the trigger signal).

## 🎯 Guaranteed Question Types
3–5 patterns that appear on almost every exam. For each: how to recognise it, the step-by-step approach, any shortcut.

## 🧠 Memory Hacks
Mnemonics, acronyms, or visual tricks for key facts.

## 🔮 The Curveball
1–2 edge cases that separate A students from B students.

## ✅ Last-Minute Checklist
10–15 bullet points to scan in the 5 minutes before the exam.

**Formatting**: Bold every key term. Keep scannable — any fact findable in under 5 seconds.
`,

  application: `
Create an **Application Note** focused on real-world usage and fully worked examples.

# 🔧 [Topic Title]: Real-World Applications

## 🌍 Where This Shows Up
3–5 concrete industries, jobs, or daily situations where this knowledge is used.

## 🛠️ Worked Examples
For each major concept, a fully worked problem:
### Example: [Scenario Name]
- **Situation**: Realistic context
- **Given**: The known information
- **Solution**: Every step with explanation
- **Answer**: Clear final result
- **Key takeaway**: What this example teaches

## 🗺️ The Decision Tree
When to use what:
- If you see [signal] → use [approach]
- If you see [different signal] → use [different approach]

## 💼 Career Connections
How this applies in specific careers (engineering, business, research, etc.).

## 🏋️ Practice Scenarios
3–5 problems of varying difficulty for the student to attempt. Include a hint for each.

**Formatting**: Bold key terms and important values. Use > blockquotes for Pro Tips.
`,

  tables: `
Create a **Tables Reference Note** — pure structured data for fast lookup.

# 📊 [Topic Title]: Quick Reference Tables

## ⚔️ Concept Comparisons
Comparison tables for every related pair/group. Columns: Definition | Key Property | When to Use | Pros | Cons.

## 📐 Formula Sheet
| Name | Formula | Variables | Use When |

## 📖 Glossary
| Term | Definition | Related To |
(alphabetical order)

## 🔢 Key Facts & Figures
| Fact | Value | Context |

## 🗂️ Classification / Taxonomy
| Category | Members | Key Characteristic |

## ⚡ Quick-Lookup Cheat Table
The single most useful reference — the one a student would print on one page.

**Formatting**: Prioritise tables over prose. Cell content 1–5 words max. Bold column headers.
`,
};

export const MINDMAP_TEMPLATE = `
Generate a hierarchical mind map as a strict JSON object. No markdown. No extra text. JSON only.

{
  "central": "Main Topic Name",
  "branches": [
    {
      "topic": "Major Category",
      "subtopics": ["Sub-point 1", "Sub-point 2", "Sub-point 3"],
      "details": "Detailed explanation of this category including definitions, examples, and key insights shown on click."
    }
  ]
}
`;
