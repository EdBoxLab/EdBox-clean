# Milestone System Implementation Plan

## Overview

This plan outlines the implementation of a comprehensive milestone system for EdBox, connecting skill mastery levels (Foundation → Intermediate → Advanced → Mastery) to the UI, implementing certificate generation, and adding visual feedback components.

## Current State Analysis

### Existing Components
- **MasteryTracker** (`src/lib/genie/brain/mastery.ts`): Basic mastery tracking with `updateMastery()` and `updateSkillProgress()` methods
- **Certificate API** (`src/app/api/certificate/generate/route.ts`): Generates certificates based on 80% skill mastery
- **Certificate UI** (`src/components/Certificate.tsx`): Display component with print-based PDF export
- **InteractiveCourseSession** (`src/components/InteractiveCourseSession.tsx`): Main learning interface with progress tracking
- **Framer Motion**: Available for animations (`framer-motion: ^12.23.24`)

### Missing Components
1. Milestone types and detection service
2. Milestone celebration UI with confetti
3. Skill unlock animations
4. Actual PDF certificate generation
5. Milestone progress indicator in course session

---

## Phase 1: Milestone Types and Tracker Service

### 1.1 Add MilestoneLevel Types

**File:** `src/types/skill-progression.ts`

```typescript
export type MilestoneLevel = 
  | 'foundation'      // 0-25% mastery
  | 'intermediate'    // 25-50% mastery
  | 'advanced'        // 50-75% mastery
  | 'mastery';        // 75-100% mastery

export interface Milestone {
  level: MilestoneLevel;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiredMastery: number;  // 0-100
  xpBonus: number;
}

export interface MilestoneProgress {
  currentLevel: MilestoneLevel;
  nextLevel: MilestoneLevel | null;
  progressToNext: number;  // 0-100 percentage
  totalMastery: number;
  recentMilestone: MilestoneLevel | null;
  milestoneHistory: MilestoneLevel[];
}
```

### 1.2 Create MilestoneTracker Service

**File:** `src/lib/services/milestone-tracker.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { MilestoneLevel } from '@/types/skill-progression';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const MilestoneTracker = {
  // Milestone thresholds
  THRESHOLDS: {
    foundation: 0,
    intermediate: 25,
    advanced: 50,
    mastery: 75,
  },

  // Get milestone level from mastery score
  getLevelFromScore(score: number): MilestoneLevel {
    if (score >= 75) return 'mastery';
    if (score >= 50) return 'advanced';
    if (score >= 25) return 'intermediate';
    return 'foundation';
  },

  // Check if milestone level changed
  async detectMilestoneTransition(
    userId: string,
    skillId: string
  ): Promise<{ previous: MilestoneLevel; current: MilestoneLevel } | null> {
    const { data: progress } = await supabase
      .from('user_skill_progress')
      .select('mastery_score, milestone_level')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (!progress) return null;

    const previous = progress.milestone_level as MilestoneLevel || 'foundation';
    const current = this.getLevelFromScore(progress.mastery_score || 0);

    if (previous !== current) {
      // Update stored milestone level
      await supabase
        .from('user_skill_progress')
        .update({ milestone_level: current })
        .eq('user_id', userId)
        .eq('skill_id', skillId);

      return { previous, current };
    }

    return null;
  },

  // Get overall milestone progress for a skill graph
  async getSkillGraphMilestoneProgress(
    userId: string,
    skillGraphId: string
  ): Promise<MilestoneProgress> {
    const { data: progressRecords } = await supabase
      .from('user_skill_progress')
      .select('mastery_score, milestone_level')
      .eq('user_id', userId)
      .eq('skill_graph_id', skillGraphId);

    const levels: MilestoneLevel[] = progressRecords?.map(p => 
      this.getLevelFromScore(p.mastery_score || 0)
    ) || [];

    const avgMastery = progressRecords?.length 
      ? progressRecords.reduce((sum, p) => sum + (p.mastery_score || 0), 0) / progressRecords.length
      : 0;

    const currentLevel = this.getLevelFromScore(avgMastery);
    const nextLevel = this.getNextLevel(currentLevel);
    
    const threshold = this.THRESHOLDS[nextLevel!];
    const progressToNext = nextLevel 
      ? Math.min(100, ((avgMastery - this.THRESHOLDS[currentLevel]) / (threshold - this.THRESHOLDS[currentLevel])) * 100)
      : 100;

    return {
      currentLevel,
      nextLevel,
      progressToNext,
      totalMastery: avgMastery,
      recentMilestone: levels[levels.length - 1] || null,
      milestoneHistory: [...new Set(levels)], // Unique milestone levels achieved
    };
  },

  getNextLevel(current: MilestoneLevel): MilestoneLevel | null {
    const order: MilestoneLevel[] = ['foundation', 'intermediate', 'advanced', 'mastery'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  },
};
```

---

## Phase 2: Backend Milestone Detection

### 2.1 Update Competency Track API

**File:** `src/app/api/competency/track/route.ts`

Add milestone information to the competency response:

```typescript
import { MilestoneTracker } from '@/lib/services/milestone-tracker';

// In POST handler, add:
const milestoneProgress = await MilestoneTracker.getSkillGraphMilestoneProgress(
  user.id,
  skillGraphId
);

return NextResponse.json({
  success: true,
  competencies,
  summary: {
    totalSkills,
    masteredSkills,
    inProgress: competencies.filter(c => c.masteryLevel > 0 && !c.isMastered).length,
    notStarted: totalSkills - competencies.length,
    overallMastery,
    eligibleForCertificate,
    milestoneProgress,  // NEW
  }
});
```

### 2.2 Integrate Milestone Detection into MasteryTracker

**File:** `src/lib/genie/brain/mastery.ts`

Update `updateMastery()` to detect and trigger milestone events:

```typescript
async updateMastery(
  userId: string,
  nodeId: string,
  score: number,
  courseId?: string,
  skillTitle?: string
): Promise<boolean> {
  const masteryAchieved = score >= 80;
  
  // ... existing logic ...
  
  // NEW: Check for milestone transition
  const transition = await MilestoneTracker.detectMilestoneTransition(userId, nodeId);
  if (transition) {
    // Trigger milestone celebration event
    await supabase
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'milestone_achieved',
        event_data: {
          skill_id: nodeId,
          previous_level: transition.previous,
          current_level: transition.current,
          score,
        },
      });
    
    // Could emit WebSocket event or cache invalidation here
  }

  return masteryAchieved;
}
```

---

## Phase 3: UI Celebration Components

### 3.1 Milestone Celebration Modal

**File:** `src/components/milestones/MilestoneCelebration.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Star, Zap } from 'lucide-react';
import Confetti from '@/components/feed/Confetti';
import { MilestoneLevel } from '@/types/skill-progression';

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: MilestoneLevel;
  skillName: string;
}

const milestoneConfig: Record<MilestoneLevel, { icon: any; color: string; label: string }> = {
  foundation: { icon: Star, color: 'text-gray-400', label: 'Foundation' },
  intermediate: { icon: Zap, color: 'text-yellow-400', label: 'Intermediate' },
  advanced: { icon: Trophy, color: 'text-orange-500', label: 'Advanced' },
  mastery: { icon: Sparkles, color: 'text-purple-500', label: 'Mastery' },
};

export default function MilestoneCelebration({ 
  isOpen, 
  onClose, 
  milestone, 
  skillName 
}: MilestoneCelebrationProps) {
  const config = milestoneConfig[milestone];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background glow */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${config.color.replace('text-', '')}/20 to-transparent opacity-50`} />
              
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className={`relative inline-flex p-4 rounded-full bg-gray-800 mb-6`}
              >
                <Icon className={`w-12 h-12 ${config.color}`} />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {config.label} Reached!
              </h2>
              <p className="text-gray-400 mb-6">
                You've advanced to <span className={config.color}>{config.label}</span> level in{' '}
                <span className="text-white font-medium">{skillName}</span>
              </p>
              
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all"
              >
                Continue Learning
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 3.2 Skill Unlock Animation Component

**File:** `src/components/milestones/SkillUnlockAnimation.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

interface SkillUnlockProps {
  isUnlocked: boolean;
  skillName: string;
  onAnimationComplete?: () => void;
}

export default function SkillUnlockAnimation({ 
  isUnlocked, 
  skillName,
  onAnimationComplete 
}: SkillUnlockProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onAnimationComplete={onAnimationComplete}
      className="flex items-center gap-3"
    >
      <motion.div
        animate={isUnlocked ? { rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.5 }}
        className={`p-2 rounded-lg ${isUnlocked ? 'bg-green-500/20' : 'bg-gray-800'}`}
      >
        {isUnlocked ? (
          <Unlock className="w-5 h-5 text-green-400" />
        ) : (
          <Lock className="w-5 h-5 text-gray-500" />
        )}
      </motion.div>
      <span className={isUnlocked ? 'text-white' : 'text-gray-500'}>
        {skillName}
      </span>
    </motion.div>
  );
}
```

### 3.3 Milestone Progress Indicator

**File:** `src/components/milestones/MilestoneProgressIndicator.tsx`

```typescript
'use client';

import { motion } from 'framer-motion';
import { MilestoneLevel } from '@/types/skill-progression';

interface MilestoneProgressIndicatorProps {
  currentLevel: MilestoneLevel;
  progressToNext: number;  // 0-100
  nextLevel: MilestoneLevel | null;
  totalMastery: number;
}

const levelColors: Record<MilestoneLevel, string> = {
  foundation: 'bg-gray-400',
  intermediate: 'bg-yellow-400',
  advanced: 'bg-orange-500',
  mastery: 'bg-purple-500',
};

const levelLabels: Record<MilestoneLevel, string> = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Mastery',
};

export default function MilestoneProgressIndicator({
  currentLevel,
  progressToNext,
  nextLevel,
  totalMastery,
}: MilestoneProgressIndicatorProps) {
  const levels: MilestoneLevel[] = ['foundation', 'intermediate', 'advanced', 'mastery'];
  const currentIndex = levels.indexOf(currentLevel);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-400">Milestone Progress</span>
        <span className={`text-sm font-medium ${levelColors[currentLevel]} bg-clip-text text-transparent`}>
          {levelLabels[currentLevel]}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="flex gap-2 mb-2">
        {levels.map((level, index) => (
          <motion.div
            key={level}
            initial={false}
            animate={{
              backgroundColor: index <= currentIndex ? levelColors[level] : '#374151',
              scale: index === currentIndex ? 1.1 : 1,
            }}
            className="flex-1 h-2 rounded-full"
          />
        ))}
      </div>
      
      {nextLevel && (
        <div className="text-xs text-gray-500">
          {Math.round(progressToNext)}% to {levelLabels[nextLevel]}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 4: Certificate PDF Generation Service

### 4.1 Install Required Dependencies

```bash
npm install jspdf html2canvas
```

### 4.2 Create Certificate PDF Generator

**File:** `src/lib/services/certificate-pdf.ts`

```typescript
import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CertificateData {
  id: string;
  userName: string;
  courseName: string;
  masteredSkills: number;
  totalSkills: number;
  overallMastery: number;
  issuedAt: string;
  verificationUrl: string;
  milestoneLevel?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background gradient effect (simplified)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, 'F');

  // Border
  doc.setDrawColor(218, 165, 32); // Gold color
  doc.setLineWidth(3);
  doc.rect(10, 10, width - 20, height - 20);
  doc.setLineWidth(1);
  doc.rect(12, 12, width - 24, height - 24);

  // Header
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate of Competency', width / 2, 35, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('EdBox Learning Platform', width / 2, 45, { align: 'center' });

  // Recipient
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('This certifies that', width / 2, 65, { align: 'center' });

  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.userName, width / 2, 80, { align: 'center' });

  // Course
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('has successfully demonstrated mastery in', width / 2, 95, { align: 'center' });

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(218, 165, 32); // Gold
  doc.text(data.courseName, width / 2, 110, { align: 'center' });

  // Milestone level
  if (data.milestoneLevel) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 0, 128);
    doc.text(`Achievement Level: ${data.milestoneLevel.toUpperCase()}`, width / 2, 125, { align: 'center' });
  }

  // Stats
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.masteredSkills}/${data.totalSkills} Skills Mastered`, width / 2 - 40, 150, { align: 'center' });
  doc.text(`${Math.round(data.overallMastery * 100)}% Overall Mastery`, width / 2 + 40, 150, { align: 'center' });

  // Verification
  doc.setFontSize(10);
  doc.setTextColor(34, 139, 34);
  doc.text('✓ Verified Certificate', width / 2, 170, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Issued on ${new Date(data.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, width / 2, 185, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`ID: ${data.id}`, width / 2, 192, { align: 'center' });
  doc.text(`Verify: ${data.verificationUrl}`, width / 2, 197, { align: 'center' });

  return doc.output('blob');
}
```

### 4.3 Update Certificate Component for PDF Download

**File:** `src/components/Certificate.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, CheckCircle, Loader } from 'lucide-react';
import { generateCertificatePDF } from '@/lib/services/certificate-pdf';

// ... existing code ...

export const Certificate: React.FC<CertificateProps> = ({ certificate }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateCertificatePDF(certificate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      window.print(); // Fallback
    } finally {
      setIsDownloading(false);
    }
  };

  // ... rest of component
};
```

---

## Phase 5: Integration into Interactive Course Flow

### 5.1 Update InteractiveCourseSession

**File:** `src/components/InteractiveCourseSession.tsx`

```typescript
import MilestoneCelebration from './milestones/MilestoneCelebration';
import MilestoneProgressIndicator from './milestones/MilestoneProgressIndicator';
import { useMilestone } from '@/hooks/useMilestone'; // NEW HOOK

export default function InteractiveCourseSession(props) {
  const { 
    showCelebration, 
    milestoneData, 
    closeCelebration 
  } = useMilestone();

  return (
    <div className="...">
      {/* Main content */}
      
      {/* Sidebar with milestone progress */}
      <div className="p-4">
        <MilestoneProgressIndicator
          currentLevel={milestoneData?.currentLevel || 'foundation'}
          progressToNext={milestoneData?.progressToNext || 0}
          nextLevel={milestoneData?.nextLevel}
          totalMastery={milestoneData?.totalMastery || 0}
        />
      </div>

      {/* Celebration modal */}
      <MilestoneCelebration
        isOpen={showCelebration}
        onClose={closeCelebration}
        milestone={milestoneData?.level || 'foundation'}
        skillName={milestoneData?.skillName || ''}
      />
    </div>
  );
}
```

### 5.2 Create useMilestone Hook

**File:** `src/hooks/useMilestone.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { MilestoneLevel } from '@/types/skill-progression';

interface MilestoneData {
  level: MilestoneLevel;
  skillId: string;
  skillName: string;
}

export function useMilestone() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);

  const checkMilestone = useCallback(async (skillId: string) => {
    try {
      const response = await fetch('/api/milestone/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      });
      
      const data = await response.json();
      if (data.milestoneAchieved) {
        setMilestoneData({
          level: data.level,
          skillId,
          skillName: data.skillName,
        });
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Milestone check failed:', error);
    }
  }, []);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
    setMilestoneData(null);
  }, []);

  return {
    showCelebration,
    milestoneData,
    checkMilestone,
    closeCelebration,
  };
}
```

### 5.3 Create Milestone Check API

**File:** `src/app/api/milestone/check/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MilestoneTracker } from '@/lib/services/milestone-tracker';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skillId } = await request.json();

    const transition = await MilestoneTracker.detectMilestoneTransition(user.id, skillId);
    
    if (transition) {
      return NextResponse.json({
        milestoneAchieved: true,
        level: transition.current,
        previousLevel: transition.previous,
        skillId,
      });
    }

    return NextResponse.json({ milestoneAchieved: false });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check milestone' },
      { status: 500 }
    );
  }
}
```

---

## Phase 6: Skill Graph View Updates

### 6.1 Add Visual Feedback to Skill Graph

**File:** `src/components/SkillGraphView.tsx`

```typescript
import SkillUnlockAnimation from './milestones/SkillUnlockAnimation';

// In the skill node rendering:
<div className="skill-node">
  <SkillUnlockAnimation
    isUnlocked={skill.unlocked}
    skillName={skill.name}
    onAnimationComplete={() => {
      if (skill.justUnlocked) {
        // Track unlock event
      }
    }}
  />
</div>
```

---

## Database Schema Updates

**File:** `supabase/migrations/xxx_milestone_system.sql`

```sql
-- Add milestone_level to user_skill_progress
ALTER TABLE user_skill_progress ADD COLUMN IF NOT EXISTS milestone_level TEXT DEFAULT 'foundation';

-- Add milestone tracking table
CREATE TABLE IF NOT EXISTS user_milestone_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id TEXT NOT NULL,
  milestone_level TEXT NOT NULL,
  mastery_score DECIMAL(5,2) NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id, milestone_level)
);

-- Add milestone_events table for celebrations
CREATE TABLE IF NOT EXISTS user_milestone_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_milestone_history_user ON user_milestone_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_events_user ON user_milestone_events(user_id);
```

---

## File Summary

| File | Purpose |
|------|---------|
| `src/types/skill-progression.ts` | Add MilestoneLevel types |
| `src/lib/services/milestone-tracker.ts` | Milestone detection service |
| `src/lib/services/certificate-pdf.ts` | PDF generation for certificates |
| `src/components/milestones/MilestoneCelebration.tsx` | Celebration modal with confetti |
| `src/components/milestones/SkillUnlockAnimation.tsx` | Skill unlock animation |
| `src/components/milestones/MilestoneProgressIndicator.tsx` | Progress display component |
| `src/hooks/useMilestone.ts` | React hook for milestone state |
| `src/app/api/milestone/check/route.ts` | API endpoint for milestone checks |
| `src/app/api/competency/track/route.ts` | Update to return milestone data |
| `src/lib/genie/brain/mastery.ts` | Integrate milestone detection |
| `src/components/Certificate.tsx` | Update with PDF download |
| `src/components/InteractiveCourseSession.tsx` | Integrate celebration UI |

---

## Implementation Order

1. **Phase 1**: Types and Tracker Service (Foundation layer)
2. **Phase 2**: Backend Integration (API updates)
3. **Phase 3**: UI Components (Celebration, Animations)
4. **Phase 4**: Certificate PDF Generation
5. **Phase 5**: Integration into Course Flow
6. **Phase 6**: Skill Graph Visual Updates

Each phase should be tested independently before moving to the next.
