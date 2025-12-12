'use client';

import WritingStudioApp from '@/lib/courseCreation/engines/writingstudio/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function WritingStudioPage() {
    return (
        <NavigationTracker title="Writing Studio">
            <WritingStudioApp />
        </NavigationTracker>
    );
}