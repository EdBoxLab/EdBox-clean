# Skill Graph Pulse Integration Plan

## Overview
Integrate the existing SkillGraphRenderer into the Pulse workspace as a first-class widget, enabling users to view and interact with their learning paths directly within Pulse.

---

## Architecture Analysis

### Current SkillGraphRenderer
**Location:** [`src/app/learning-path/[id]/SkillGraphRenderer.tsx`](src/app/learning-path/[id]/SkillGraphRenderer.tsx)

**Props:**
```typescript
interface SkillGraphRendererProps {
  graph: SkillGraph;
  challenges?: Record<string, Challenge>;
}
```

**Key Features:**
- Progress tracking via `useMultipleSkillsProgress` hook
- Skill selection and challenge management
- HeroSection, SkillCard, NotificationSystem components
- PrerequisitesModal for locked skills
- EngineModal for immersive learning (now deleted - needs removal)

### Pulse Widget System
**Location:** [`src/app/pulse/`](src/app/pulse/)

**Key Files:**
| File | Purpose |
|------|---------|
| [`types.ts`](src/app/pulse/types.ts) | `WindowType` enum and `PulseWindow` interface |
| [`App.tsx`](src/app/pulse/App.tsx) | Main app with window management and deep linking |
| [`components/Workspace/Canvas.tsx`](src/app/pulse/components/Workspace/Canvas.tsx) | Widget renderer based on `window.type` |
| [`services/genie-tooling.ts`](src/app/pulse/services/genie-tooling.ts) | Genie tool definitions |

**Deep Linking:**
- URL format: `/pulse?type=TYPE&id=ID`
- Currently supports: `STUDY_KIT`, `COURSE`, `NOTE`

---

## Implementation Plan

### Phase 1: Add WindowType

**File:** [`src/app/pulse/types.ts`](src/app/pulse/types.ts)

Add to `WindowType` enum:
```typescript
SKILL_GRAPH = 'SKILL_GRAPH',
```

### Phase 2: Create SkillGraphWidget Component

**New File:** `src/app/pulse/components/Widgets/SkillGraphWidget.tsx`

```typescript
import React from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph } from '@/lib/courseCreation/types';

interface SkillGraphWidgetProps {
  window: PulseWindow;
}

const SkillGraphWidget: React.FC<SkillGraphWidgetProps> = ({ window }) => {
  // Fetch skill graph data using window.data?.graphId or window.metadata?.graphId
  // Render a simplified/adapted version of SkillGraphRenderer
  // Handle skill selection, progress tracking, etc.
};

export default SkillGraphWidget;
```

**Key Adaptations:**
1. Fetch graph data from Supabase using graphId
2. Remove EngineModal integration (engines deleted)
3. Use Pulse's `onUpdate` pattern for state management
4. Simplified UI for widget context

### Phase 3: Update Canvas.tsx

**File:** [`src/app/pulse/components/Workspace/Canvas.tsx`](src/app/pulse/components/Workspace/Canvas.tsx)

Add import:
```typescript
import SkillGraphWidget from '../Widgets/SkillGraphWidget';
```

Add case to `renderWidgetContent`:
```typescript
case WindowType.SKILL_GRAPH:
  return <SkillGraphWidget window={window} />;
```

### Phase 4: Update Deep Linking

**File:** [`src/app/pulse/App.tsx`](src/app/pulse/App.tsx)

Update `handleDeepLinks` function:
```typescript
if (type === 'SKILL_GRAPH' || type === 'COURSE') {
  addWindow(WindowType.SKILL_GRAPH, { graphId: id });
}
```

### Phase 5: Update Genie Tooling

**File:** [`src/app/pulse/services/genie-tooling.ts`](src/app/pulse/services/genie-tooling.ts)

Update `SYSTEM_INSTRUCTION` to mention skill graph capability:
```
- **Skill Graph**: Display learning paths with progress tracking.
```

### Phase 6: Update Constants

**File:** [`src/app/pulse/constants.ts`](src/app/pulse/constants.ts)

Add config for SKILL_GRAPH:
```typescript
[WindowType.SKILL_GRAPH]: {
  defaultTitle: 'Learning Path',
  defaultWidth: 600,
  defaultHeight: 500,
}
```

---

## Data Flow

```mermaid
flowchart TD
    A[User clicks course] --> B[Dashboard generates link]
    B --> C[/pulse?type=COURSE&id=123]
    C --> D[Pulse App.tsx]
    D --> E[handleDeepLinks]
    E --> F[addWindow SKILL_GRAPH]
    F --> G[Canvas renders SkillGraphWidget]
    G --> H[Widget fetches graph from Supabase]
    H --> I[Display skill graph with progress]
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/app/pulse/types.ts` | Add `SKILL_GRAPH` to `WindowType` enum |
| `src/app/pulse/constants.ts` | Add widget config |
| `src/app/pulse/App.tsx` | Update deep linking |
| `src/app/pulse/components/Workspace/Canvas.tsx` | Add widget renderer |
| `src/app/pulse/services/genie-tooling.ts` | Update system instruction |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/pulse/components/Widgets/SkillGraphWidget.tsx` | New widget component |

---

## Questions for User

1. **Should the skill graph widget be a simplified view or the full SkillGraphRenderer?**
   - Simplified: Just nodes and progress, click opens full page
   - Full: Complete SkillGraphRenderer embedded in widget

2. **How should skill selection work in the widget?**
   - Navigate to skill details in same widget
   - Open a new widget pane with skill details
   - Just show progress, no interaction

3. **Should we keep the separate `/learning-path/[id]` page or fully migrate to Pulse?**

## Overview
Integrate the existing SkillGraphRenderer into the Pulse workspace as a first-class widget, enabling users to view and interact with their learning paths directly within Pulse.

---

## Architecture Analysis

### Current SkillGraphRenderer
**Location:** [`src/app/learning-path/[id]/SkillGraphRenderer.tsx`](src/app/learning-path/[id]/SkillGraphRenderer.tsx)

**Props:**
```typescript
interface SkillGraphRendererProps {
  graph: SkillGraph;
  challenges?: Record<string, Challenge>;
}
```

**Key Features:**
- Progress tracking via `useMultipleSkillsProgress` hook
- Skill selection and challenge management
- HeroSection, SkillCard, NotificationSystem components
- PrerequisitesModal for locked skills
- EngineModal for immersive learning (now deleted - needs removal)

### Pulse Widget System
**Location:** [`src/app/pulse/`](src/app/pulse/)

**Key Files:**
| File | Purpose |
|------|---------|
| [`types.ts`](src/app/pulse/types.ts) | `WindowType` enum and `PulseWindow` interface |
| [`App.tsx`](src/app/pulse/App.tsx) | Main app with window management and deep linking |
| [`components/Workspace/Canvas.tsx`](src/app/pulse/components/Workspace/Canvas.tsx) | Widget renderer based on `window.type` |
| [`services/genie-tooling.ts`](src/app/pulse/services/genie-tooling.ts) | Genie tool definitions |

**Deep Linking:**
- URL format: `/pulse?type=TYPE&id=ID`
- Currently supports: `STUDY_KIT`, `COURSE`, `NOTE`

---

## Implementation Plan

### Phase 1: Add WindowType

**File:** [`src/app/pulse/types.ts`](src/app/pulse/types.ts)

Add to `WindowType` enum:
```typescript
SKILL_GRAPH = 'SKILL_GRAPH',
```

### Phase 2: Create SkillGraphWidget Component

**New File:** `src/app/pulse/components/Widgets/SkillGraphWidget.tsx`

```typescript
import React from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph } from '@/lib/courseCreation/types';

interface SkillGraphWidgetProps {
  window: PulseWindow;
}

const SkillGraphWidget: React.FC<SkillGraphWidgetProps> = ({ window }) => {
  // Fetch skill graph data using window.data?.graphId or window.metadata?.graphId
  // Render a simplified/adapted version of SkillGraphRenderer
  // Handle skill selection, progress tracking, etc.
};

export default SkillGraphWidget;
```

**Key Adaptations:**
1. Fetch graph data from Supabase using graphId
2. Remove EngineModal integration (engines deleted)
3. Use Pulse's `onUpdate` pattern for state management
4. Simplified UI for widget context

### Phase 3: Update Canvas.tsx

**File:** [`src/app/pulse/components/Workspace/Canvas.tsx`](src/app/pulse/components/Workspace/Canvas.tsx)

Add import:
```typescript
import SkillGraphWidget from '../Widgets/SkillGraphWidget';
```

Add case to `renderWidgetContent`:
```typescript
case WindowType.SKILL_GRAPH:
  return <SkillGraphWidget window={window} />;
```

### Phase 4: Update Deep Linking

**File:** [`src/app/pulse/App.tsx`](src/app/pulse/App.tsx)

Update `handleDeepLinks` function:
```typescript
if (type === 'SKILL_GRAPH' || type === 'COURSE') {
  addWindow(WindowType.SKILL_GRAPH, { graphId: id });
}
```

### Phase 5: Update Genie Tooling

**File:** [`src/app/pulse/services/genie-tooling.ts`](src/app/pulse/services/genie-tooling.ts)

Update `SYSTEM_INSTRUCTION` to mention skill graph capability:
```
- **Skill Graph**: Display learning paths with progress tracking.
```

### Phase 6: Update Constants

**File:** [`src/app/pulse/constants.ts`](src/app/pulse/constants.ts)

Add config for SKILL_GRAPH:
```typescript
[WindowType.SKILL_GRAPH]: {
  defaultTitle: 'Learning Path',
  defaultWidth: 600,
  defaultHeight: 500,
}
```

---

## Data Flow

```mermaid
flowchart TD
    A[User clicks course] --> B[Dashboard generates link]
    B --> C[/pulse?type=COURSE&id=123]
    C --> D[Pulse App.tsx]
    D --> E[handleDeepLinks]
    E --> F[addWindow SKILL_GRAPH]
    F --> G[Canvas renders SkillGraphWidget]
    G --> H[Widget fetches graph from Supabase]
    H --> I[Display skill graph with progress]
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/app/pulse/types.ts` | Add `SKILL_GRAPH` to `WindowType` enum |
| `src/app/pulse/constants.ts` | Add widget config |
| `src/app/pulse/App.tsx` | Update deep linking |
| `src/app/pulse/components/Workspace/Canvas.tsx` | Add widget renderer |
| `src/app/pulse/services/genie-tooling.ts` | Update system instruction |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/pulse/components/Widgets/SkillGraphWidget.tsx` | New widget component |

---

## Questions for User

1. **Should the skill graph widget be a simplified view or the full SkillGraphRenderer?**
   - Simplified: Just nodes and progress, click opens full page
   - Full: Complete SkillGraphRenderer embedded in widget

2. **How should skill selection work in the widget?**
   - Navigate to skill details in same widget
   - Open a new widget pane with skill details
   - Just show progress, no interaction

3. **Should we keep the separate `/learning-path/[id]` page or fully migrate to Pulse?**

