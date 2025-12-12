'use client';

import MathLabApp from '@/lib/courseCreation/engines/mathlab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function MathLabPage() {
    return (
        <NavigationTracker title="MathLab">
            <MathLabApp />
        </NavigationTracker>
    );
}