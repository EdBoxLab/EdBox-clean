import { NextRequest, NextResponse } from 'next/server';
import { generateWithRetry, cleanJsonResponse } from '@/lib/ai-providers';
import { InteractiveCourseSessionManager } from '@/lib/services/interactive-course-session-manager';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { SessionManager } from '@/lib/genie/brain/session';

const sessionManager = new InteractiveCourseSessionManager(true);

export async function POST(request: NextRequest) {
    const supabase = createServerSupabaseClient();
    try {
        const { challenge, answer, sessionId, imageUrl, iterationId } = await request.json();

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

                    // Update the new user_competency table (Anthropic Memory style)
                    if (session.userId && session.currentTopic && concept) {
                        const { data: existingCompetency } = await supabase
                            .from('user_competency')
                            .select('confidence, mastery_state')
                            .eq('user_id', session.userId)
                            .eq('topic', session.currentTopic)
                            .eq('concept', concept)
                            .single();

                        const currentConfidence = existingCompetency?.confidence || 0;
                        const newConfidence = Math.min(1.0, currentConfidence + 0.2); // Increment by 20% on pass

                        await supabase
                            .from('user_competency')
                            .upsert({
                                user_id: session.userId,
                                topic: session.currentTopic,
                                concept: concept,
                                confidence: newConfidence,
                                mastery_state: {
                                    ...existingCompetency?.mastery_state,
                                    last_score: evaluation.score,
                                    last_evaluated_at: new Date().toISOString()
                                },
                                last_updated: new Date().toISOString()
                            }, { onConflict: 'user_id,topic,concept' });
                    }
                }
            } catch (persistError) {
                console.error('Failed to persist challenge progress:', persistError);
            }
        }

        // Update learning_loop_iterations if iterationId is provided
        if (iterationId) {
            try {
                const masteryAchieved = evaluation.passed && evaluation.score >= 0.8;
                await SessionManager.markEvaluationCompleted(iterationId, masteryAchieved);
            } catch (iterError) {
                console.error('Failed to update iteration:', iterError);
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
