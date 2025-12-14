'use client';

import WritingStudioApp from '@/lib/courseCreation/engines/writingstudio/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function WritingStudioPage() {
    return (
        <NavigationTracker title="Writing Studio">
            <WritingStudioApp challenge={{
              id: 'demo-challenge',
              skillId: 'writing-basics',
              title: 'Writing Fundamentals',
              description: 'Learn basic writing skills',
              engine: 'writingstudio',
              difficulty: 'Easy',
              estimatedMinutes: 30,
              xpReward: 100,
              validationCriteria: [],
              hints: ['Start with a clear topic'],
              explanation: 'This is a demo challenge'
            }} />
        </NavigationTracker>
    );
}