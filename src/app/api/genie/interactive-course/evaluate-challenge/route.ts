import { NextRequest, NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { sessionManager } from '@/lib/services/interactive-course-session-manager';

export async function POST(request: NextRequest) {
    try {
        const { challenge, answer, sessionId } = await request.json();

        if (!challenge || !answer) {
            return NextResponse.json(
                { error: 'Missing challenge data or answer' },
                { status: 400 }
            );
        }

        const systemPrompt = `You are an expert tutor evaluating a learner's challenge submission.
    
CHALLENGE:
Title: ${challenge.title}
Description: ${challenge.description}
Difficulty: ${challenge.difficultyLevel}

LEARNER'S ANSWER:
"${answer}"

EVALUATION RUBRIC:
1. Correctness: Does the answer address the challenge objectives?
2. Depth: Is the explanation or solution sufficiently detailed?
3. Logic: Is the reasoning sound?

YOUR TASK:
Return a JSON object with:
- "passed": boolean
- "feedback": a concise, encouraging explanation of why they passed or what to improve.
- "score": number (0-1) representing the quality of the answer.
- "xrReward": number (calculated based on difficulty and score. Easy: 50, Medium: 100, Hard: 200 max).

Format: Return ONLY the JSON object. DO NOT include any explanatory text or markdown code block wrappers (e.g.,text, json).`;

        const result = await generateWithRetry({
            prompt: `Evaluate this submission: "${answer}"`,
            systemPrompt,
            temperature: 0.3,
        });

        const evaluation = JSON.parse(result.text || '{}');

        // Persist session update if sessionId is provided
        if (sessionId && evaluation.passed) {
            try {
                const resumeData = await sessionManager.getSessionResumeData(sessionId);
                const session = resumeData.session;

                if (session.progressState) {
                    session.progressState.challengesCompleted = (session.progressState.challengesCompleted || 0) + 1;

                    // Update mastered skills
                    const concept = challenge.title || session.currentTopic;
                    if (concept && !session.progressState.masteredSkills.includes(concept)) {
                        session.progressState.masteredSkills.push(concept);
                    }

                    await sessionManager.persistSession(session);
                }
            } catch (persistError) {
                console.error('Failed to persist challenge progress:', persistError);
            }
        }

        return NextResponse.json({
            success: true,
            ...evaluation
        });

    } catch (error: any) {
        console.error('Challenge Evaluation Error:', error);
        return NextResponse.json(
            { error: 'Failed to evaluate challenge' },
            { status: 500 }
        );
    }
}
