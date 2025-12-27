import { NextRequest, NextResponse } from 'next/server';
import { generateWithRetry, cleanJsonResponse } from '@/lib/ai-providers';
import { sessionManager } from '@/lib/services/interactive-course-session-manager';

export async function POST(request: NextRequest) {
    try {
        const { challenge, answer, sessionId, imageUrl } = await request.json();

        if (!challenge || (!answer && !imageUrl)) {
            return NextResponse.json(
                { error: 'Missing challenge data, answer or image' },
                { status: 400 }
            );
        }

        let attachments: any[] = [];
        if (imageUrl) {
            try {
                const imageRes = await fetch(imageUrl);
                const arrayBuffer = await imageRes.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
                
                attachments.push({
                    mimeType: contentType,
                    data: base64
                });
            } catch (error) {
                console.error('Failed to process image:', error);
            }
        }

        const systemPrompt = `You are an expert tutor evaluating a learner's challenge submission.
    
CHALLENGE:
Title: ${challenge.title}
Description: ${challenge.description}
Difficulty: ${challenge.difficultyLevel}

LEARNER'S SUBMISSION:
Textual part: "${answer || 'No text provided'}"
${imageUrl ? 'An image submission is also attached.' : ''}

EVALUATION RUBRIC:
1. Correctness: Does the answer (text and/or image) address the challenge objectives?
2. Depth: Is the solution sufficiently detailed?
3. Logic/Visual evidence: If an image is provided, does it demonstrate the requested task correctly?
4. Integration: Does the textual explanation align with the visual evidence (if any)?

YOUR TASK:
Return a JSON object with:
- "passed": boolean
- "feedback": a concise, encouraging explanation of why they passed or what to improve. Be specific about what you see in the image if provided.
- "score": number (0-1) representing the quality of the answer.
- "xrReward": number (calculated based on difficulty and score. Easy: 50, Medium: 100, Hard: 200 max).

Format: Return ONLY the JSON object. DO NOT include any explanatory text or markdown code block wrappers (e.g.,text, json).`;

        const schema = {
            type: "object",
            properties: {
                passed: { type: "boolean" },
                feedback: { type: "string" },
                score: { type: "number" },
                xrReward: { type: "number" }
            },
            required: ["passed", "feedback", "score", "xrReward"]
        };

        const result = await generateWithRetry({
            prompt: `Evaluate this submission. Text: "${answer || 'See attached image'}"`,
            systemPrompt,
            temperature: 0.3,
            attachments,
            schema
        });


        const cleanedText = cleanJsonResponse(result.text || '{}');
        const evaluation = JSON.parse(cleanedText);

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
