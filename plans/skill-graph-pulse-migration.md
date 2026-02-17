# Skill Graph Full Migration to Pulse

## Overview
Migrate the complete SkillGraphRenderer functionality into Pulse as a widget, and remove the standalone `/learning-path/[id]` page.

---

## Implementation Steps

### Step 1: Add SKILL_GRAPH WindowType

**File:** `src/app/pulse/types.ts`

```typescript
// Add to WindowType enum
SKILL_GRAPH = 'SKILL_GRAPH',
```

---

### Step 2: Update Constants

**File:** `src/app/pulse/constants.ts`

```typescript
[WindowType.SKILL_GRAPH]: {
  defaultTitle: 'Learning Path',
  defaultWidth: 800,
  defaultHeight: 600,
}
```

---

### Step 3: Create SkillGraphWidget

**New File:** `src/app/pulse/components/Widgets/SkillGraphWidget.tsx`

This component will:
1. Accept `window` prop with `graphId` in data
2. Fetch graph data from Supabase
3. Render the full SkillGraphRenderer
4. Handle skill selection and challenge navigation

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

// Import the existing renderer components
import SkillGraphRenderer from '@/app/learning-path/[id]/SkillGraphRenderer';

interface SkillGraphWidgetProps {
  window: PulseWindow;
}

const SkillGraphWidget: React.FC<SkillGraphWidgetProps> = ({ window }) => {
  const [graph, setGraph] = useState<SkillGraph | null>(null);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const graphId = window.data?.graphId || window.metadata?.graphId;

  useEffect(() => {
    if (!graphId) {
      setError('No graph ID provided');
      setLoading(false);
      return;
    }

    fetchGraph();
  }, [graphId]);

  const fetchGraph = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Fetch graph
      const { data: graphData, error: graphError } = await supabase
        .from('skill_graphs')
        .select('*')
        .eq('id', graphId)
        .single();

      if (graphError) throw graphError;
      
      setGraph(graphData as SkillGraph);

      // Fetch challenges
      const skillIds = graphData.nodes?.map((n: any) => n.id) || [];
      if (skillIds.length > 0) {
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('*')
          .in('skill_id', skillIds);
        
        const challengesMap: Record<string, Challenge> = {};
        (challengesData || []).forEach((c: any) => {
          challengesMap[c.skill_id] = c;
        });
        setChallenges(challengesMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        {error || 'Graph not found'}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <SkillGraphRenderer graph={graph} challenges={challenges} />
    </div>
  );
};

export default SkillGraphWidget;
```

---

### Step 4: Update Canvas.tsx

**File:** `src/app/pulse/components/Workspace/Canvas.tsx`

Add import:
```typescript
import SkillGraphWidget from '../Widgets/SkillGraphWidget';
```

Add case in `renderWidgetContent`:
```typescript
case WindowType.SKILL_GRAPH:
  return <SkillGraphWidget window={window} />;
```

---

### Step 5: Update Deep Linking in App.tsx

**File:** `src/app/pulse/App.tsx`

Update `handleDeepLinks`:
```typescript
if (type === 'SKILL_GRAPH' || type === 'COURSE') {
  addWindow(WindowType.SKILL_GRAPH, { graphId: id });
}
```

---

### Step 6: Update Genie Tooling

**File:** `src/app/pulse/services/genie-tooling.ts`

Add to `SYSTEM_INSTRUCTION`:
```
- **Skill Graph**: Display learning paths with progress tracking and skill nodes.
```

---

### Step 7: Update Dashboard Links

**File:** `src/app/(main)/dashboard/page.tsx`

Already correct - uses `/pulse?type=COURSE&id=${c.id}`

---

### Step 8: Remove EngineModal from SkillGraphRenderer

**File:** `src/app/learning-path/[id]/SkillGraphRenderer.tsx`

Remove:
- Import of `EngineModal` (line 17)
- `selectedSkill` state usage for engine modal
- Any engine-related logic

The skill selection should instead:
- Open a new widget pane with skill details
- Or show skill details inline

---

### Step 9: Delete /learning-path/[id] Directory

After confirming Pulse integration works:
- Delete `src/app/learning-path/[id]/` directory
- Keep `src/app/learning-path/` for the list page if it exists

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/pulse/types.ts` | Add `SKILL_GRAPH` to enum |
| `src/app/pulse/constants.ts` | Add widget config |
| `src/app/pulse/App.tsx` | Update deep linking |
| `src/app/pulse/components/Workspace/Canvas.tsx` | Add widget case |
| `src/app/pulse/services/genie-tooling.ts` | Update instructions |
| `src/app/learning-path/[id]/SkillGraphRenderer.tsx` | Remove EngineModal |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/pulse/components/Widgets/SkillGraphWidget.tsx` | Widget wrapper |

## Files to Delete

| File/Directory | Reason |
|----------------|--------|
| `src/app/learning-path/[id]/` | Migrated to Pulse |

---

## Execution Order

1. Add WindowType and constants
2. Create SkillGraphWidget
3. Update Canvas.tsx
4. Update App.tsx deep linking
5. Update Genie tooling
6. Test the integration
7. Remove EngineModal from SkillGraphRenderer
8. Delete /learning-path/[id] directory

## Overview
Migrate the complete SkillGraphRenderer functionality into Pulse as a widget, and remove the standalone `/learning-path/[id]` page.

---

## Implementation Steps

### Step 1: Add SKILL_GRAPH WindowType

**File:** `src/app/pulse/types.ts`

```typescript
// Add to WindowType enum
SKILL_GRAPH = 'SKILL_GRAPH',
```

---

### Step 2: Update Constants

**File:** `src/app/pulse/constants.ts`

```typescript
[WindowType.SKILL_GRAPH]: {
  defaultTitle: 'Learning Path',
  defaultWidth: 800,
  defaultHeight: 600,
}
```

---

### Step 3: Create SkillGraphWidget

**New File:** `src/app/pulse/components/Widgets/SkillGraphWidget.tsx`

This component will:
1. Accept `window` prop with `graphId` in data
2. Fetch graph data from Supabase
3. Render the full SkillGraphRenderer
4. Handle skill selection and challenge navigation

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

// Import the existing renderer components
import SkillGraphRenderer from '@/app/learning-path/[id]/SkillGraphRenderer';

interface SkillGraphWidgetProps {
  window: PulseWindow;
}

const SkillGraphWidget: React.FC<SkillGraphWidgetProps> = ({ window }) => {
  const [graph, setGraph] = useState<SkillGraph | null>(null);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const graphId = window.data?.graphId || window.metadata?.graphId;

  useEffect(() => {
    if (!graphId) {
      setError('No graph ID provided');
      setLoading(false);
      return;
    }

    fetchGraph();
  }, [graphId]);

  const fetchGraph = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Fetch graph
      const { data: graphData, error: graphError } = await supabase
        .from('skill_graphs')
        .select('*')
        .eq('id', graphId)
        .single();

      if (graphError) throw graphError;
      
      setGraph(graphData as SkillGraph);

      // Fetch challenges
      const skillIds = graphData.nodes?.map((n: any) => n.id) || [];
      if (skillIds.length > 0) {
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('*')
          .in('skill_id', skillIds);
        
        const challengesMap: Record<string, Challenge> = {};
        (challengesData || []).forEach((c: any) => {
          challengesMap[c.skill_id] = c;
        });
        setChallenges(challengesMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        {error || 'Graph not found'}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <SkillGraphRenderer graph={graph} challenges={challenges} />
    </div>
  );
};

export default SkillGraphWidget;
```

---

### Step 4: Update Canvas.tsx

**File:** `src/app/pulse/components/Workspace/Canvas.tsx`

Add import:
```typescript
import SkillGraphWidget from '../Widgets/SkillGraphWidget';
```

Add case in `renderWidgetContent`:
```typescript
case WindowType.SKILL_GRAPH:
  return <SkillGraphWidget window={window} />;
```

---

### Step 5: Update Deep Linking in App.tsx

**File:** `src/app/pulse/App.tsx`

Update `handleDeepLinks`:
```typescript
if (type === 'SKILL_GRAPH' || type === 'COURSE') {
  addWindow(WindowType.SKILL_GRAPH, { graphId: id });
}
```

---

### Step 6: Update Genie Tooling

**File:** `src/app/pulse/services/genie-tooling.ts`

Add to `SYSTEM_INSTRUCTION`:
```
- **Skill Graph**: Display learning paths with progress tracking and skill nodes.
```

---

### Step 7: Update Dashboard Links

**File:** `src/app/(main)/dashboard/page.tsx`

Already correct - uses `/pulse?type=COURSE&id=${c.id}`

---

### Step 8: Remove EngineModal from SkillGraphRenderer

**File:** `src/app/learning-path/[id]/SkillGraphRenderer.tsx`

Remove:
- Import of `EngineModal` (line 17)
- `selectedSkill` state usage for engine modal
- Any engine-related logic

The skill selection should instead:
- Open a new widget pane with skill details
- Or show skill details inline

---

### Step 9: Delete /learning-path/[id] Directory

After confirming Pulse integration works:
- Delete `src/app/learning-path/[id]/` directory
- Keep `src/app/learning-path/` for the list page if it exists

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/pulse/types.ts` | Add `SKILL_GRAPH` to enum |
| `src/app/pulse/constants.ts` | Add widget config |
| `src/app/pulse/App.tsx` | Update deep linking |
| `src/app/pulse/components/Workspace/Canvas.tsx` | Add widget case |
| `src/app/pulse/services/genie-tooling.ts` | Update instructions |
| `src/app/learning-path/[id]/SkillGraphRenderer.tsx` | Remove EngineModal |

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/pulse/components/Widgets/SkillGraphWidget.tsx` | Widget wrapper |

## Files to Delete

| File/Directory | Reason |
|----------------|--------|
| `src/app/learning-path/[id]/` | Migrated to Pulse |

---

## Execution Order

1. Add WindowType and constants
2. Create SkillGraphWidget
3. Update Canvas.tsx
4. Update App.tsx deep linking
5. Update Genie tooling
6. Test the integration
7. Remove EngineModal from SkillGraphRenderer
8. Delete /learning-path/[id] directory

