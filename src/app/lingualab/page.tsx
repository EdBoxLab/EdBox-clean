'use client';

import LinguaLabApp from '@/lib/courseCreation/engines/lingualab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function LinguaLabPage() {
    return (
        <NavigationTracker title="LinguaLab">
            <LinguaLabApp challenge={{
              id: 'demo-challenge',
              skillId: 'language-basics',
              title: 'Language Learning',
              description: 'Learn language fundamentals',
              engine: 'lingualab',
              difficulty: 'Easy',
              estimatedMinutes: 30,
              xpReward: 100,
              validationCriteria: [],
              hints: ['Start with basic vocabulary'],
              explanation: 'This is a demo challenge'
            }} />
        </NavigationTracker>
    );
}