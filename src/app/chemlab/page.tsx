'use client';

import ChemLabApp from '@/lib/courseCreation/engines/chemlab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function ChemLabPage() {
    return (
        <NavigationTracker title="ChemLab">
            <ChemLabApp />
        </NavigationTracker>
    );
}