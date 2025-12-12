'use client';

import LinguaLabApp from '@/lib/courseCreation/engines/lingualab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function LinguaLabPage() {
    return (
        <NavigationTracker title="LinguaLab">
            <LinguaLabApp />
        </NavigationTracker>
    );
}