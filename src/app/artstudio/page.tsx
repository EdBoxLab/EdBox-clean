'use client';

import ArtStudioApp from '@/lib/courseCreation/engines/artstudio/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function ArtStudioPage() {
    return (
        <NavigationTracker title="Art Studio">
            <ArtStudioApp />
        </NavigationTracker>
    );
}