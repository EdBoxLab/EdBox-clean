'use client';

import React from 'react';
import { Card } from '../../../../components/ui/card';
import { StudyKitContent } from '../../../../components/study-kit/StudyKitContent';
import { PulseWindow } from '../../types';

interface PulseStudyKitProps {
    window: PulseWindow;
}

const PulseStudyKit: React.FC<PulseStudyKitProps> = ({ window }) => {
    const kitId = window.data?.kitId;

    return (
        <div className="h-full w-full flex flex-col bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                <StudyKitContent kitId={kitId} embedded={true} />
            </div>
        </div>
    );
};

export default PulseStudyKit;
