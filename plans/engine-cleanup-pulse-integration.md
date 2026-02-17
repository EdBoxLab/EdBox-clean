# Engine Cleanup & Pulse Integration Plan

## Overview
This plan outlines the cleanup of deleted engine references and the integration of Pulse as the central learning experience using `ai-providers.ts`.

---

## Phase 1: Fix Broken Imports (Critical)

### 1.1 Create New groqService Wrapper
The old `@/lib/courseCreation/engines/shared/groqService` was deleted but is still imported in 5 files.

**Solution:** Create `src/lib/services/groqService.ts` that wraps `ai-providers.ts`:

```typescript
// src/lib/services/groqService.ts
import { streamWithFallback, generateWithFallback } from '@/lib/ai-providers';

export async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const result = await generateWithFallback({
    prompt,
    systemPrompt,
    temperature: 0.7,
  });
  return result.text;
}

export async function* streamGroq(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
  yield* streamWithFallback({
    prompt,
    systemPrompt,
    temperature: 0.7,
  });
}
```

### 1.2 Update Import Paths in These Files:
| File | Current Import | New Import |
|------|----------------|------------|
| `src/lib/services/challenge-generator.ts` | `@/lib/courseCreation/engines/shared/groqService` | `@/lib/services/groqService` |
| `src/lib/services/__tests__/challenge-generator.test.ts` | Same | Same |
| `src/lib/services/engine-evaluation.ts` | Same | Same |
| `src/app/actions/generate-challenges.ts` | Same | Same |
| `src/app/actions/evaluate-challenge.ts` | Same | Same |

---

## Phase 2: Delete Engine-Related Services

### 2.1 Delete Entire Files
These files contain engine-specific logic that is no longer needed:

| File | Reason |
|------|--------|
| `src/lib/services/engine-evaluation.ts` | Contains switch statements for all deleted engines |
| `src/lib/services/challenge-generator.ts` | Uses engine-specific templates |
| `src/lib/services/evaluation-integration.ts` | Depends on engine-evaluation.ts |

### 2.2 Update Files with Engine Switch Statements
| File | Action |
|------|--------|
| `src/lib/services/skill-configuration-manager.ts` | Remove engine switch statements (lines 434-442) |
| `src/lib/services/skill-configuration-export.ts` | Remove engine switch statements (lines 471-479) |

---

## Phase 3: Update EngineType Enums

### 3.1 Files to Update
| File | Action |
|------|--------|
| `src/app/api/learning-path/generate/types/enums.ts` | Remove all engine types or replace with single `Pulse` type |
| `src/app/api/coursecreation/route.ts` | Remove EngineType enum (lines 21-31) |
| `src/app/api/learning-path/generate/ai/generateSkillGraph.ts` | Remove normalizeEngine function and switch statement |

### 3.2 Proposed New Enum
```typescript
export enum EngineType {
  Pulse = "pulse"
}
```

---

## Phase 4: Delete Engine Pages

### 4.1 Delete These Directories
| Directory | Reason |
|-----------|--------|
| `src/app/engines/` | Lists all deleted engines with broken links |
| `src/app/finlab/` | Dedicated page for deleted engine |
| `src/app/historymach/` | Dedicated page for deleted engine |

---

## Phase 5: Update Course Navigation to Pulse

### 5.1 Files That Link to Courses
| File | Current Behavior | New Behavior |
|------|------------------|--------------|
| `src/app/(main)/dashboard/page.tsx` | Links to `/pulse?type=COURSE&id=${c.id}` | Already correct! |
| `src/app/(main)/courses/page.tsx` | Needs verification | Redirect to Pulse |
| `src/app/(main)/courses/[courseId]/page.tsx` | Opens course directly | Redirect to Pulse |

### 5.2 Implementation
Update course cards and course pages to redirect to `/pulse?type=COURSE&id=${courseId}`.

---

## Phase 6: Update Pulse to Use ai-providers.ts

### 6.1 Current State
Pulse services in `src/app/pulse/services/` use:
- `@google/genai` directly with `NEXT_PUBLIC_GEMINI_API_KEY`

### 6.2 Target State
Update to use `ai-providers.ts` for:
- Key rotation and fallback
- Unified API interface
- Better rate limit handling

### 6.3 Files to Update
| File | Changes |
|------|---------|
| `src/app/pulse/services/genie.ts` | Replace direct Gemini with `streamWithFallback` |
| `src/app/pulse/services/genie-chat.ts` | Same |
| `src/app/pulse/services/genie-tooling.ts` | Verify tool definitions work with new provider |

---

## Phase 7: Clean Up Test Files

### 7.1 Files to Update or Delete
| File | Action |
|------|--------|
| `src/lib/services/__tests__/challenge-generator.test.ts` | Delete (tests deleted functionality) |
| `src/__tests__/system-integration.test.ts` | Remove engine-related test cases |
| `src/app/api/learning-path/generate/ai/generateSkillGraph.test.ts` | Remove engine mapping tests |

---

## Execution Order

1. **Phase 1** - Fix broken imports first (prevents build errors)
2. **Phase 2** - Delete engine-related services
3. **Phase 3** - Update EngineType enums
4. **Phase 4** - Delete engine pages
5. **Phase 5** - Update course navigation
6. **Phase 6** - Update Pulse to use ai-providers
7. **Phase 7** - Clean up tests

---

## Files Summary

### To Create
- `src/lib/services/groqService.ts`

### To Delete
- `src/lib/services/engine-evaluation.ts`
- `src/lib/services/challenge-generator.ts`
- `src/lib/services/evaluation-integration.ts`
- `src/lib/services/__tests__/challenge-generator.test.ts`
- `src/app/engines/` (entire directory)
- `src/app/finlab/` (entire directory)
- `src/app/historymach/` (entire directory)

### To Modify
- `src/lib/services/skill-configuration-manager.ts`
- `src/lib/services/skill-configuration-export.ts`
- `src/app/api/learning-path/generate/types/enums.ts`
- `src/app/api/coursecreation/route.ts`
- `src/app/api/learning-path/generate/ai/generateSkillGraph.ts`
- `src/app/(main)/courses/page.tsx`
- `src/app/(main)/courses/[courseId]/page.tsx`
- `src/app/pulse/services/genie.ts`
- `src/app/pulse/services/genie-chat.ts`
- `src/__tests__/system-integration.test.ts`
- `src/app/api/learning-path/generate/ai/generateSkillGraph.test.ts`

## Overview
This plan outlines the cleanup of deleted engine references and the integration of Pulse as the central learning experience using `ai-providers.ts`.

---

## Phase 1: Fix Broken Imports (Critical)

### 1.1 Create New groqService Wrapper
The old `@/lib/courseCreation/engines/shared/groqService` was deleted but is still imported in 5 files.

**Solution:** Create `src/lib/services/groqService.ts` that wraps `ai-providers.ts`:

```typescript
// src/lib/services/groqService.ts
import { streamWithFallback, generateWithFallback } from '@/lib/ai-providers';

export async function callGroq(prompt: string, systemPrompt?: string): Promise<string> {
  const result = await generateWithFallback({
    prompt,
    systemPrompt,
    temperature: 0.7,
  });
  return result.text;
}

export async function* streamGroq(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
  yield* streamWithFallback({
    prompt,
    systemPrompt,
    temperature: 0.7,
  });
}
```

### 1.2 Update Import Paths in These Files:
| File | Current Import | New Import |
|------|----------------|------------|
| `src/lib/services/challenge-generator.ts` | `@/lib/courseCreation/engines/shared/groqService` | `@/lib/services/groqService` |
| `src/lib/services/__tests__/challenge-generator.test.ts` | Same | Same |
| `src/lib/services/engine-evaluation.ts` | Same | Same |
| `src/app/actions/generate-challenges.ts` | Same | Same |
| `src/app/actions/evaluate-challenge.ts` | Same | Same |

---

## Phase 2: Delete Engine-Related Services

### 2.1 Delete Entire Files
These files contain engine-specific logic that is no longer needed:

| File | Reason |
|------|--------|
| `src/lib/services/engine-evaluation.ts` | Contains switch statements for all deleted engines |
| `src/lib/services/challenge-generator.ts` | Uses engine-specific templates |
| `src/lib/services/evaluation-integration.ts` | Depends on engine-evaluation.ts |

### 2.2 Update Files with Engine Switch Statements
| File | Action |
|------|--------|
| `src/lib/services/skill-configuration-manager.ts` | Remove engine switch statements (lines 434-442) |
| `src/lib/services/skill-configuration-export.ts` | Remove engine switch statements (lines 471-479) |

---

## Phase 3: Update EngineType Enums

### 3.1 Files to Update
| File | Action |
|------|--------|
| `src/app/api/learning-path/generate/types/enums.ts` | Remove all engine types or replace with single `Pulse` type |
| `src/app/api/coursecreation/route.ts` | Remove EngineType enum (lines 21-31) |
| `src/app/api/learning-path/generate/ai/generateSkillGraph.ts` | Remove normalizeEngine function and switch statement |

### 3.2 Proposed New Enum
```typescript
export enum EngineType {
  Pulse = "pulse"
}
```

---

## Phase 4: Delete Engine Pages

### 4.1 Delete These Directories
| Directory | Reason |
|-----------|--------|
| `src/app/engines/` | Lists all deleted engines with broken links |
| `src/app/finlab/` | Dedicated page for deleted engine |
| `src/app/historymach/` | Dedicated page for deleted engine |

---

## Phase 5: Update Course Navigation to Pulse

### 5.1 Files That Link to Courses
| File | Current Behavior | New Behavior |
|------|------------------|--------------|
| `src/app/(main)/dashboard/page.tsx` | Links to `/pulse?type=COURSE&id=${c.id}` | Already correct! |
| `src/app/(main)/courses/page.tsx` | Needs verification | Redirect to Pulse |
| `src/app/(main)/courses/[courseId]/page.tsx` | Opens course directly | Redirect to Pulse |

### 5.2 Implementation
Update course cards and course pages to redirect to `/pulse?type=COURSE&id=${courseId}`.

---

## Phase 6: Update Pulse to Use ai-providers.ts

### 6.1 Current State
Pulse services in `src/app/pulse/services/` use:
- `@google/genai` directly with `NEXT_PUBLIC_GEMINI_API_KEY`

### 6.2 Target State
Update to use `ai-providers.ts` for:
- Key rotation and fallback
- Unified API interface
- Better rate limit handling

### 6.3 Files to Update
| File | Changes |
|------|---------|
| `src/app/pulse/services/genie.ts` | Replace direct Gemini with `streamWithFallback` |
| `src/app/pulse/services/genie-chat.ts` | Same |
| `src/app/pulse/services/genie-tooling.ts` | Verify tool definitions work with new provider |

---

## Phase 7: Clean Up Test Files

### 7.1 Files to Update or Delete
| File | Action |
|------|--------|
| `src/lib/services/__tests__/challenge-generator.test.ts` | Delete (tests deleted functionality) |
| `src/__tests__/system-integration.test.ts` | Remove engine-related test cases |
| `src/app/api/learning-path/generate/ai/generateSkillGraph.test.ts` | Remove engine mapping tests |

---

## Execution Order

1. **Phase 1** - Fix broken imports first (prevents build errors)
2. **Phase 2** - Delete engine-related services
3. **Phase 3** - Update EngineType enums
4. **Phase 4** - Delete engine pages
5. **Phase 5** - Update course navigation
6. **Phase 6** - Update Pulse to use ai-providers
7. **Phase 7** - Clean up tests

---

## Files Summary

### To Create
- `src/lib/services/groqService.ts`

### To Delete
- `src/lib/services/engine-evaluation.ts`
- `src/lib/services/challenge-generator.ts`
- `src/lib/services/evaluation-integration.ts`
- `src/lib/services/__tests__/challenge-generator.test.ts`
- `src/app/engines/` (entire directory)
- `src/app/finlab/` (entire directory)
- `src/app/historymach/` (entire directory)

### To Modify
- `src/lib/services/skill-configuration-manager.ts`
- `src/lib/services/skill-configuration-export.ts`
- `src/app/api/learning-path/generate/types/enums.ts`
- `src/app/api/coursecreation/route.ts`
- `src/app/api/learning-path/generate/ai/generateSkillGraph.ts`
- `src/app/(main)/courses/page.tsx`
- `src/app/(main)/courses/[courseId]/page.tsx`
- `src/app/pulse/services/genie.ts`
- `src/app/pulse/services/genie-chat.ts`
- `src/__tests__/system-integration.test.ts`
- `src/app/api/learning-path/generate/ai/generateSkillGraph.test.ts`

