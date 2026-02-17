# Study Kit Model Configuration Plan

## Objective
Configure different AI models for study kit generation:
- **Quizzes, Flashcards, Mindmaps**: Use `llama-3.1-8b-instant` (faster, cheaper)
- **Notes**: Use `llama-3.3-70b-versatile` (higher quality for detailed content)

## Current State Analysis

All study kit content types currently use `llama-3.3-70b-versatile`:

| File | Content Types | Current Model |
|------|---------------|---------------|
| [`src/lib/study-kit/service.ts`](src/lib/study-kit/service.ts) | quizzes, flashcards, mindmaps, notes | llama-3.3-70b-versatile |
| [`src/app/api/study-kit/generate-more/route.ts`](src/app/api/study-kit/generate-more/route.ts) | quizzes, flashcards, notes | llama-3.3-70b-versatile |
| [`src/app/api/study-kit/generate-chapters/route.ts`](src/app/api/study-kit/generate-chapters/route.ts) | quizzes, flashcards, mindmaps, notes | llama-3.3-70b-versatile |

## Implementation Plan

### Step 1: Update Model Type Definition
**File**: [`src/lib/ai-providers.ts:164`](src/lib/ai-providers.ts:164)

Update the model type to include `llama-3.1-8b-instant`:
```typescript
model?: 'versatile' | 'oss' | 'vision' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
```

### Step 2: Update Study Kit Service
**File**: [`src/lib/study-kit/service.ts`](src/lib/study-kit/service.ts)

| Function | Content Type | Line | Change |
|----------|--------------|------|--------|
| `generateChapterContent()` | quizzes | 60 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | flashcards | 77 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | mindmaps | 94 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | notes | 114 | Keep `llama-3.3-70b-versatile` ✓ |
| `generateSingleContent()` | quizzes/flashcards batch | 175 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateSingleContent()` | notes | 201 | Keep `llama-3.3-70b-versatile` ✓ |
| `generateSingleContent()` | standard | 223 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |

### Step 3: Update Generate More Route
**File**: [`src/app/api/study-kit/generate-more/route.ts`](src/app/api/study-kit/generate-more/route.ts)

| Content Type | Line | Change |
|--------------|------|--------|
| quizzes/flashcards | 183 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| notes | 203 | Keep `llama-3.3-70b-versatile` ✓ |

### Step 4: Update Generate Chapters Route
**File**: [`src/app/api/study-kit/generate-chapters/route.ts`](src/app/api/study-kit/generate-chapters/route.ts)

| Content Type | Line | Change |
|--------------|------|--------|
| notes | 410 | Keep `llama-3.3-70b-versatile` ✓ |
| quizzes | 432 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| flashcards | 443 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| mindmaps | 454 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |

## Model Comparison

| Feature | llama-3.1-8b-instant | llama-3.3-70b-versatile |
|---------|----------------------|-------------------------|
| Speed | Faster | Slower |
| Cost | Lower | Higher |
| Quality | Good for structured output | Better for nuanced content |
| Best For | Quizzes, Flashcards, Mindmaps | Notes, Deep explanations |

## Files to Modify

1. `src/lib/ai-providers.ts` - Add model type
2. `src/lib/study-kit/service.ts` - Update model assignments
3. `src/app/api/study-kit/generate-more/route.ts` - Update model assignments
4. `src/app/api/study-kit/generate-chapters/route.ts` - Update model assignments

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Study Kit Generation                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │    Quizzes      │         │    Notes        │            │
│  │   Flashcards    │         │                 │            │
│  │    Mindmaps     │         │  Deep quality   │            │
│  │                 │         │  content        │            │
│  │ llama-3.1-8b    │         │ llama-3.3-70b   │            │
│  │   -instant      │         │  -versatile     │            │
│  │                 │         │                 │            │
│  │  Fast & Cheap   │         │  High Quality   │            │
│  └─────────────────┘         └─────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Objective
Configure different AI models for study kit generation:
- **Quizzes, Flashcards, Mindmaps**: Use `llama-3.1-8b-instant` (faster, cheaper)
- **Notes**: Use `llama-3.3-70b-versatile` (higher quality for detailed content)

## Current State Analysis

All study kit content types currently use `llama-3.3-70b-versatile`:

| File | Content Types | Current Model |
|------|---------------|---------------|
| [`src/lib/study-kit/service.ts`](src/lib/study-kit/service.ts) | quizzes, flashcards, mindmaps, notes | llama-3.3-70b-versatile |
| [`src/app/api/study-kit/generate-more/route.ts`](src/app/api/study-kit/generate-more/route.ts) | quizzes, flashcards, notes | llama-3.3-70b-versatile |
| [`src/app/api/study-kit/generate-chapters/route.ts`](src/app/api/study-kit/generate-chapters/route.ts) | quizzes, flashcards, mindmaps, notes | llama-3.3-70b-versatile |

## Implementation Plan

### Step 1: Update Model Type Definition
**File**: [`src/lib/ai-providers.ts:164`](src/lib/ai-providers.ts:164)

Update the model type to include `llama-3.1-8b-instant`:
```typescript
model?: 'versatile' | 'oss' | 'vision' | 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
```

### Step 2: Update Study Kit Service
**File**: [`src/lib/study-kit/service.ts`](src/lib/study-kit/service.ts)

| Function | Content Type | Line | Change |
|----------|--------------|------|--------|
| `generateChapterContent()` | quizzes | 60 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | flashcards | 77 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | mindmaps | 94 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateChapterContent()` | notes | 114 | Keep `llama-3.3-70b-versatile` ✓ |
| `generateSingleContent()` | quizzes/flashcards batch | 175 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| `generateSingleContent()` | notes | 201 | Keep `llama-3.3-70b-versatile` ✓ |
| `generateSingleContent()` | standard | 223 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |

### Step 3: Update Generate More Route
**File**: [`src/app/api/study-kit/generate-more/route.ts`](src/app/api/study-kit/generate-more/route.ts)

| Content Type | Line | Change |
|--------------|------|--------|
| quizzes/flashcards | 183 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| notes | 203 | Keep `llama-3.3-70b-versatile` ✓ |

### Step 4: Update Generate Chapters Route
**File**: [`src/app/api/study-kit/generate-chapters/route.ts`](src/app/api/study-kit/generate-chapters/route.ts)

| Content Type | Line | Change |
|--------------|------|--------|
| notes | 410 | Keep `llama-3.3-70b-versatile` ✓ |
| quizzes | 432 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| flashcards | 443 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |
| mindmaps | 454 | `llama-3.3-70b-versatile` → `llama-3.1-8b-instant` |

## Model Comparison

| Feature | llama-3.1-8b-instant | llama-3.3-70b-versatile |
|---------|----------------------|-------------------------|
| Speed | Faster | Slower |
| Cost | Lower | Higher |
| Quality | Good for structured output | Better for nuanced content |
| Best For | Quizzes, Flashcards, Mindmaps | Notes, Deep explanations |

## Files to Modify

1. `src/lib/ai-providers.ts` - Add model type
2. `src/lib/study-kit/service.ts` - Update model assignments
3. `src/app/api/study-kit/generate-more/route.ts` - Update model assignments
4. `src/app/api/study-kit/generate-chapters/route.ts` - Update model assignments

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Study Kit Generation                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌─────────────────┐            │
│  │    Quizzes      │         │    Notes        │            │
│  │   Flashcards    │         │                 │            │
│  │    Mindmaps     │         │  Deep quality   │            │
│  │                 │         │  content        │            │
│  │ llama-3.1-8b    │         │ llama-3.3-70b   │            │
│  │   -instant      │         │  -versatile     │            │
│  │                 │         │                 │            │
│  │  Fast & Cheap   │         │  High Quality   │            │
│  └─────────────────┘         └─────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

