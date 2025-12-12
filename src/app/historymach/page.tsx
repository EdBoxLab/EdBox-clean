'use client';

import HistoryMachApp from '@/lib/courseCreation/engines/historymach/App';
import { NavigationTracker } from '@/components/NavigationTracker';

export default function HistoryMachPage() {
    return (
        <NavigationTracker title="History Machine">
            <HistoryMachApp />
        </NavigationTracker>
    );
}