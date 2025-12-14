'use client';

import MathLabApp from '@/lib/courseCreation/engines/mathlab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function MathLabPage() {
    return (
        <NavigationTracker title="MathLab">
            <MathLabApp challenge={{
              id: 'demo-challenge',
              skillId: 'math-basics',
              title: 'Math Fundamentals',
              description: 'Learn basic mathematics',
              engine: 'mathlab',
              difficulty: 'Easy',
              estimatedMinutes: 30,
              xpReward: 100,
              validationCriteria: [],
              hints: ['Start with basic operations'],
              explanation: 'This is a demo challenge'
            }} />
        </NavigationTracker>
    );
}