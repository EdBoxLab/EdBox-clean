import { NextRequest, NextResponse } from 'next/server';
import { generateResearchPackage } from '../../../services/geminiService';
import type { Source, CitationStyle } from '../../../types';
import { handleAPIError } from '@/lib/utils/errorHandler';

export async function POST(req: NextRequest) {
  try {
    const { goal, audience, citationStyle, sources } = await req.json();

    if (!goal || !audience || !citationStyle || !sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const researchPackage = await generateResearchPackage(goal, audience, citationStyle, sources, () => {});

    return NextResponse.json(researchPackage);
  } catch (error) {
    return handleAPIError(error, req);
  }
}