'use client';

import CodeStudioApp from '@/lib/courseCreation/engines/codestudio/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function CodeStudioPage() {
    return (
        <NavigationTracker title="Code Studio">
            <CodeStudioApp />
        </NavigationTracker>
    );
}