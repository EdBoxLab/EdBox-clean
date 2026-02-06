# StudyKit Multi-Notes: Bug Fixes & Implementation Gap Analysis

## Issue 1: Notes Rendering as JSON

### Root Cause

The JSON rendering bug occurs when **old study kits** (created before the multi-note system) are loaded. The `normalizeContent()` function in [`page.tsx`](src/app/(main)/tools/study-kit/page.tsx:409) has a fallback path at line 518-519 that wraps unexpected objects in `JSON.stringify()`:

```typescript
// Line 518-519 — the problematic fallback
} else if (typeof parsed === 'object') {
    normalized.notes = { deepExplanation: JSON.stringify(parsed, null, 2), cheatsheet: '', application: '', tables: '' };
```

This means if the AI returns notes as a structured object that does NOT have the expected `deepExplanation`/`cheatsheet`/`application`/`tables` keys, it gets `JSON.stringify`-ed and displayed as raw JSON text in the Deep Explanation tab.

Additionally, line 512-513 has a similar issue for array items with object content:

```typescript
} else if (typeof note.content === 'object') {
    text += JSON.stringify(note.content, null, 2);
```

### Fix Required

In [`normalizeContent()`](src/app/(main)/tools/study-kit/page.tsx:409):
1. When notes is an object without the 4 expected keys, check if it has markdown-like string values and extract them intelligently instead of `JSON.stringify`-ing
2. If the object has keys that look like note content (any string values), concatenate them into `deepExplanation` as markdown
3. For array items with object content, convert to readable markdown instead of JSON

---

## Issue 2: Implementation Status vs Plan

### Phase 1: Backend Templates — FULLY IMPLEMENTED ✅

All 4 specialized templates exist in [`route.ts`](src/app/api/study-kit/generate/route.ts:13) as `NOTE_TEMPLATES`:
- `deepExplanation` (lines 14-54)
- `cheatsheet` (lines 56-102)
- `application` (lines 104-145)
- `tables` (lines 147-208)

**Note:** The old [`templates.ts`](src/app/api/study-kit/generate/templates.ts:48) still exports `NOTES_TEMPLATE` (the old single-note template) but it is **no longer used** by the route. The route has its own `NOTE_TEMPLATES` object. The old file is dead code for notes.

### Phase 2: Backend Generation Logic — FULLY IMPLEMENTED ✅

The [`route.ts`](src/app/api/study-kit/generate/route.ts:558) generates all 4 note types in parallel:
- Lines 559-590: When `type === 'notes'`, it creates 4 parallel promises for each `NoteType`
- Each gets its own system prompt (lines 565-570)
- Uses `cleanMarkdown()` to strip code block wrappers
- Results assembled into `notesObj` with proper keys

### Phase 3: Frontend Notes Rendering — MOSTLY IMPLEMENTED ✅ (with bugs)

- Sub-tab navigation exists (lines 1625-1648) with `noteSubTabs` array
- `activeNoteType` state management works (line 330)
- Content renders via `ReactMarkdown` at line 1786: `generatedContent.notes?.[activeNoteType]`
- Copy button works per note type (lines 1610-1620)

**Bug:** The `normalizeContent()` fallback paths produce JSON strings instead of markdown for legacy/unexpected formats.

### Phase 4: Frontend Polish — MOSTLY IMPLEMENTED ✅ (minor gaps)

- Visual differentiation with colors/icons per note type ✅
- Copy button per note type ✅
- Loading states for individual note types — **NOT IMPLEMENTED** ❌ (all 4 notes load together, no per-note loading indicator)
- NoteNavigation component works with active note type ✅

### Phase 5: Migration & Backward Compatibility — PARTIALLY IMPLEMENTED ⚠️

- `normalizeContent()` handles old `string` format → wraps in `deepExplanation` ✅
- `normalizeContent()` handles old `string[]` format → joins and wraps ✅
- **BUG:** Object fallback uses `JSON.stringify` instead of intelligent extraction ❌
- `generate-more` route handles multi-note format for appending custom notes ✅

---

## Detailed Fix Plan

### Fix 1: normalizeContent() JSON rendering bug

**File:** [`src/app/(main)/tools/study-kit/page.tsx`](src/app/(main)/tools/study-kit/page.tsx:495)

**What to change:** The notes normalization block (lines 495-523)

The current logic at line 499 checks:
```typescript
if (typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.deepExplanation || parsed.cheatsheet || parsed.application || parsed.tables))
```

This only matches if the object has at least one of the 4 expected keys. If the AI returns an object with different keys (e.g., `{overview: "...", concepts: "..."}` or the old format), it falls through to the `JSON.stringify` fallback.

**Fix:** Add a smarter fallback that:
1. Checks if the object has string values that look like markdown content
2. Concatenates all string values with section headers into `deepExplanation`
3. Only uses `JSON.stringify` as an absolute last resort (and even then, wraps it in a code block so it renders properly)

```typescript
} else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    // Object without expected keys — extract string values as markdown
    const stringValues = Object.entries(parsed)
        .filter(([_, v]) => typeof v === 'string' && v.length > 0)
        .map(([key, value]) => `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n${value}`)
        .join('\n\n---\n\n');
    
    if (stringValues) {
        normalized.notes = { deepExplanation: stringValues, cheatsheet: '', application: '', tables: '' };
    } else {
        // Truly unrecognizable — wrap in code block so it at least renders cleanly
        normalized.notes = { deepExplanation: '```json\n' + JSON.stringify(parsed, null, 2) + '\n```', cheatsheet: '', application: '', tables: '' };
    }
}
```

### Fix 2: Array item object content rendering

**File:** [`src/app/(main)/tools/study-kit/page.tsx`](src/app/(main)/tools/study-kit/page.tsx:512)

**What to change:** Line 512-513 inside the array normalization

```typescript
// Current (bad):
} else if (typeof note.content === 'object') {
    text += JSON.stringify(note.content, null, 2);
}

// Fixed:
} else if (typeof note.content === 'object') {
    const entries = Object.entries(note.content)
        .filter(([_, v]) => typeof v === 'string')
        .map(([k, v]) => `**${k}**: ${v}`)
        .join('\n\n');
    text += entries || JSON.stringify(note.content, null, 2);
}
```

### Fix 3: Clean up dead code in templates.ts (optional)

**File:** [`src/app/api/study-kit/generate/templates.ts`](src/app/api/study-kit/generate/templates.ts:48)

The `NOTES_TEMPLATE` export is no longer used by the generation route. It could be removed to avoid confusion, but this is cosmetic.

---

## Summary of Changes Required

| File | Change | Priority |
|------|--------|----------|
| [`page.tsx`](src/app/(main)/tools/study-kit/page.tsx:518) | Fix object fallback in `normalizeContent()` to extract markdown instead of JSON.stringify | **HIGH** — This is the JSON rendering bug |
| [`page.tsx`](src/app/(main)/tools/study-kit/page.tsx:512) | Fix array item object content to render as markdown | **HIGH** — Related JSON rendering issue |
| [`templates.ts`](src/app/api/study-kit/generate/templates.ts:48) | Remove unused `NOTES_TEMPLATE` export | LOW — Dead code cleanup |

## What Is Already Working

- All 4 note templates generate correctly on the backend
- Parallel generation of 4 note types works
- Sub-tab UI with icons, colors, and labels works
- Copy per note type works
- NoteNavigation HUD works
- Backward compatibility for string and string[] formats works
- Generate-more route handles multi-note format
