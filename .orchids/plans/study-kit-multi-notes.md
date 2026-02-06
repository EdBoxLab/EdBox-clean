# StudyKit Multi-Notes System

## Requirements

Transform the current single-note StudyKit output into a **4-part multi-note system** while maintaining the 1:10 density ratio. Each note type serves a distinct purpose:

1. **Deep Explanation Note** - A comprehensive page that explains the material so well the student doesn't need to touch the source material
2. **Plain Cheatsheet** - Actionable exam/test-focused content in plain, understandable terms (no gibberish)
3. **Application Note** - Practical real-world applications and worked examples
4. **Tables Reference** - High-density comparison tables and reference data (keeping existing table functionality)

## Current State Analysis

### Current Architecture
- **Route**: `src/app/api/study-kit/generate/route.ts`
- **Templates**: `src/app/api/study-kit/generate/templates.ts`
- **Frontend**: `src/app/(main)/tools/study-kit/page.tsx`
- **Storage**: `study_kit_content` table (Supabase) - stores `generated_content` as JSONB

### Current Notes Behavior
- Single `NOTES_TEMPLATE` generates one combined "High-Leverage Cheat Sheet"
- Output stored as `string` or `string[]` (for multi-chunk documents)
- Rendered with ReactMarkdown in a single view with pagination for multi-chunk
- Uses "1:10 density ratio" but mixes concepts: cheat sheets, active recall, tables, etc.

### Problem
The current single note tries to do everything:
- Mental models
- Exam predictions
- Procedural steps
- Comparison tables
- Active recall questions

This results in a cluttered experience where students can't quickly find what they need.

## Solution Design

### Architecture Change: Notes as Object with 4 Keys

```typescript
// New notes structure
type NotesContent = {
  deepExplanation: string;    // Full understanding note
  cheatsheet: string;         // Plain-terms exam prep
  application: string;        // Real-world applications
  tables: string;             // Reference tables
}

// In generated_content
{
  quizzes: Quiz[],
  flashcards: Flashcard[],
  mindmaps: MindmapData,
  notes: NotesContent  // Changed from string | string[]
}
```

### 4 Specialized Templates

#### 1. Deep Explanation Template
Focus: **Complete understanding without source material**
- Thorough concept explanations with analogies
- Step-by-step breakdowns of complex ideas
- Visual descriptions and mental models
- Prerequisites and foundational knowledge
- "Feynman-style" simple explanations

#### 2. Plain Cheatsheet Template  
Focus: **What will actually come out in tests/exams**
- "Professor's favorites" - commonly tested topics
- Quick-reference formulas and definitions
- Common exam question patterns
- Memorization shortcuts and mnemonics
- Plain language (no academic jargon)

#### 3. Application Note Template
Focus: **Real-world usage and worked examples**
- Practical scenarios and case studies
- Fully worked problems with explanations
- "When to use this" decision trees
- Career/industry relevance
- Hands-on exercises

#### 4. Tables Reference Template
Focus: **High-density comparison data**
- Concept vs concept comparisons
- Quick-lookup reference tables
- Formula sheets
- Terminology glossaries
- Structured data summaries

### UI/UX Design

#### Tab-Based Note Navigation
```
[ Deep Explanation ] [ Cheatsheet ] [ Application ] [ Tables ]
```

- Horizontal tabs within the Notes section
- Each tab shows its specific note type
- Visual indicators for note type (icons)
- "Copy" button per note type

#### Visual Differentiation
| Note Type | Icon | Color Accent | Tag |
|-----------|------|--------------|-----|
| Deep Explanation | BookOpen | Blue | "Master the Material" |
| Cheatsheet | Target | Green | "Exam Ready" |
| Application | Briefcase | Orange | "Real World" |
| Tables | Table2 | Purple | "Quick Reference" |

## Implementation Phases

### Phase 1: Backend - Create 4 New Templates
- Create `DEEP_EXPLANATION_TEMPLATE` - comprehensive understanding-focused prompt
- Create `PLAIN_CHEATSHEET_TEMPLATE` - exam-focused plain language prompt  
- Create `APPLICATION_NOTE_TEMPLATE` - practical usage and examples prompt
- Create `TABLES_REFERENCE_TEMPLATE` - structured data and comparisons prompt
- Update `templates.ts` with all 4 new templates

### Phase 2: Backend - Update Generation Logic
- Modify `route.ts` to generate 4 parallel note types when 'notes' is selected
- Update `buildPrompt()` to handle the 4 note type variants
- Ensure each note respects the 1:10 density ratio (divide among 4 notes)
- Add proper error handling for partial generation failures

### Phase 3: Frontend - Update Notes Rendering
- Add sub-tab navigation within the Notes tab for 4 note types
- Create `NoteTypeTab` component with icons and labels
- Update state management for `activeNoteType`
- Render correct note content based on selected type

### Phase 4: Frontend - Polish UI
- Add visual differentiation (colors, icons) per note type
- Add "Copy" button per note type
- Add loading states for individual note types
- Update NoteNavigation component to work with active note type

### Phase 5: Migration & Backward Compatibility
- Handle existing study kits with old `notes` format (string/string[])
- Add migration logic in `normalizeContent()` to convert old format
- Ensure graceful fallback if some note types fail to generate

## Technical Details

### API Request/Response Changes

**Request** (no change needed - contentTypes still includes 'notes')

**Response Structure Change**:
```json
{
  "success": true,
  "content": {
    "notes": {
      "deepExplanation": "# Complete Guide to...",
      "cheatsheet": "# Exam Cheatsheet...",
      "application": "# Real-World Applications...",
      "tables": "| Concept | Definition |..."
    }
  }
}
```

### Database Consideration
- No schema change needed - `generated_content` is JSONB
- New structure will be stored as nested object within `notes` key
- Old kits remain functional via normalization

### Prompt Engineering Guidelines
- Each template should explicitly state its purpose
- Include "DO NOT include" sections to prevent overlap
- Specify word count targets: ~600-800 words per note type
- Maintain 1:10 total density (split as ~2.5:10 per note)

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/api/study-kit/generate/templates.ts` | Major | Add 4 new note templates |
| `src/app/api/study-kit/generate/route.ts` | Major | Update notes generation to parallel 4 types |
| `src/app/(main)/tools/study-kit/page.tsx` | Major | Add sub-tabs, update rendering logic |
| `src/components/NoteNavigation.tsx` | Minor | Support activeNoteType prop |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Longer generation time (4x notes) | Parallel generation, show progress per note |
| Token limit exceeded | Each note gets reduced token budget (~1500 each) |
| Inconsistent quality across notes | Strong prompt engineering, retry logic |
| Old study kits break | Backward-compatible normalization function |

## Success Criteria
- 4 distinct, high-quality note types generated
- Each note serves its specific purpose without overlap
- Total generation time < 2x current single note time
- Existing study kits continue to work
- Users can navigate between note types easily
