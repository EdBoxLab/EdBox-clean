'use client';

import dynamic from 'next/dynamic';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';

// Dynamically import SkillGraphRenderer with ssr disabled
const SkillGraphRenderer = dynamic(() => import('./SkillGraphRenderer'), {
    ssr: false,
});

interface Props {
    graph: SkillGraph;
    challenges: Record<string, Challenge>;
}

export default function SkillGraphWrapper({ graph, challenges }: Props) {
    return <SkillGraphRenderer graph={graph} challenges={challenges} />;
}
