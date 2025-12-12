'use client';

import FinLabApp from '@/lib/courseCreation/engines/finlab/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function FinLabPage() {
    return (
        <NavigationTracker title="FinLab">
            <FinLabApp />
        </NavigationTracker>
    );
}