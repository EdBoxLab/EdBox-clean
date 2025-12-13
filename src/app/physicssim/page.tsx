'use client';

import { App as PhysicsSimApp } from '@/lib/courseCreation/engines/physicssim/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function PhysicsSimPage() {
    return (
        <NavigationTracker title="Physics Simulator">
            <PhysicsSimApp />
        </NavigationTracker>
    );
}