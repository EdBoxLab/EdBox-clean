# Chapter ID Regeneration Issue

## Issue Description

The chapter ID generation logic in [`src/lib/chapter-detection.ts`](../src/lib/chapter-detection.ts) uses array index-based IDs that regenerate on every detection:

```typescript
id: `ch_${i + 1}`
```

## Locations Found

1. Line 535: `id: \`ch_${i + 1}\``
2. Line 586: `id: \`ch_${i + 1}\``
3. Line 634: `id: \`ch_${i + 1}\``
4. Line 787: `id: \`ch_${i + 1}\``

## Problem

When chapters are detected from the same document multiple times:
- IDs are regenerated based on array position
- If chapter order changes or chapters are added/removed, IDs shift
- This breaks references to specific chapters in the database
- User progress tracking may be lost if chapter IDs change

## Impact

- **High**: If users can re-detect chapters from the same document
- **Medium**: If chapter detection is only done once per document
- **Low**: If chapter IDs are only used transiently during generation

## Recommended Solution (NOT IMPLEMENTED)

Replace index-based IDs with stable identifiers:

```typescript
// Option 1: Hash-based ID from chapter title + position
id: `ch_${hashString(chapter.title + chapter.chapterNumber)}`

// Option 2: UUID-based ID
id: `ch_${generateUUID()}`

// Option 3: Content-based hash
id: `ch_${hashString(chapter.sourceContext.substring(0, 100))}`
```

## Status

**DOCUMENTED ONLY** - No changes made to ID generation logic per task constraints.
Requires explicit approval before modification.

## Related Files

- [`src/lib/chapter-detection.ts`](../src/lib/chapter-detection.ts) - Chapter detection logic
- [`src/app/api/study-kit/generate/route.ts`](../src/app/api/study-kit/generate/route.ts) - Study kit generation API
