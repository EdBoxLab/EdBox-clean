'use client';

import BioNexusApp from '@/lib/courseCreation/engines/bionexus/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function BioNexusPage() {
    return (
        <NavigationTracker title="BioNexus">
            <BioNexusApp />
        </NavigationTracker>
    );
}