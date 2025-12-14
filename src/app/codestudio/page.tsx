'use client';

import CodeStudioApp from '@/lib/courseCreation/engines/codestudio/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function CodeStudioPage() {
    return (
        <NavigationTracker title="Code Studio">
            <CodeStudioApp challenge={{
              id: 'demo-challenge',
              skillId: 'javascript-basics',
              title: 'JavaScript Basics',
              description: 'Learn the fundamentals of JavaScript',
              engine: 'codestudio',
              difficulty: 'Easy',
              estimatedMinutes: 30,
              xpReward: 100,
              validationCriteria: [],
              hints: ['Start with console.log()'],
              explanation: 'This is a demo challenge'
            }} />
        </NavigationTracker>
    );
}