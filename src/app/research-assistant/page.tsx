'use client';
import dynamic from 'next/dynamic';

const ResearchAssistantClient = dynamic(() => import('./ResearchAssistantClient'), { ssr: false });

export default function ResearchAssistantPage() {
  return <ResearchAssistantClient />;
}
