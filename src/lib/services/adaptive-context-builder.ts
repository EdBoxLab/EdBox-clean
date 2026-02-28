/**
 * Adaptive Context Builder — Production Grade
 *
 * Composes all intelligence layers into a single context string
 * injected into every Genie turn during a skill session.
 *
 * All methods are async — backed by persistent services.
 */

import { getStudentModelService } from './student-model';
import { getSpacedRepetitionService } from './spaced-repetition';

export interface AdaptiveContextInput {
    userId: string;
    skillId: string;
    graphId: string;
    currentStage?: string;
    topicsRemaining?: string[];
}

/**
 * Build the full adaptive context for Genie's system prompt injection.
 * Async: reads from persistent stores (Supabase or in-memory fallback).
 */
export async function buildAdaptiveContext(input: AdaptiveContextInput): Promise<string> {
    const { userId, skillId, graphId, currentStage, topicsRemaining } = input;

    const parts: string[] = [];

    // 1. Student knowledge model
    const studentModel = getStudentModelService();
    const studentSummary = await studentModel.getSummary(userId, skillId, graphId);
    parts.push(studentSummary);

    // 2. Spaced repetition
    const srService = getSpacedRepetitionService();
    const reviewSummary = await srService.getReviewSummary(userId, skillId);
    if (reviewSummary) {
        parts.push(reviewSummary);
    }

    // 3. Session metadata
    if (currentStage) {
        parts.push(`[SESSION STATE] Current stage: ${currentStage}`);
    }
    if (topicsRemaining && topicsRemaining.length > 0) {
        parts.push(`[TOPICS REMAINING] ${topicsRemaining.join(', ')}`);
    }

    return parts.join('\n');
}
