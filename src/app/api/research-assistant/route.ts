import { NextRequest, NextResponse } from 'next/server';
import { generateResearchPackage } from '../../../services/geminiService';
import type { Source, CitationStyle } from '../../../types';

export async function POST(req: NextRequest) {
  try {
    const { goal, audience, citationStyle, sources } = await req.json();

    if (!goal || !audience || !citationStyle || !sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // No need for a status callback in the backend
    const researchPackage = await generateResearchPackage(goal, audience, citationStyle, sources, () => {});

    return NextResponse.json(researchPackage);
  } catch (error) {
    console.error('Error generating research package:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate research package', details: errorMessage }, { status: 500 });
  }
}
