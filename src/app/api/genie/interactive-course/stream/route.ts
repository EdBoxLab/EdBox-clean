import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const {
            userMessage,
            sessionId,
            courseId,
            currentTopic,
            learningContext,
            courseContent,
            conversationHistory,
            chatSummary
        } = await request.json();

        if (!userMessage || !sessionId) {
            return new Response(
                JSON.stringify({ error: 'Message and session ID required' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { data: { session } } = await supabase.auth.getSession();
        let userProfileContext = '';
        let courseSpecificContext = '';

        if (session) {
            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('education, country, age')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                userProfileContext = `
User Profile:
- Education: ${profile.education || 'General'}
- Country: ${profile.country || 'Global'}
- Age: ${profile.age || 'Unknown'}`;
            }

            // Get course-specific context if courseId provided
            if (courseId) {
                const { data: course } = await supabase
                    .from('courses')
                    .select('title, description, category')
                    .eq('id', courseId)
                    .single();

                if (course) {
                    courseSpecificContext = `
Course Context:
- Course: "${course.title}"
- Category: ${course.category}
- Description: ${course.description || 'Interactive learning course'}`;
                }
            }
        }

        // Build comprehensive learning context
        const contextParts = [];
        
        if (currentTopic) {
            contextParts.push(`Current Topic: ${currentTopic}`);
        }
        
        if (learningContext) {
            if (learningContext.currentConcepts?.length > 0) {
                contextParts.push(`Currently Learning: ${learningContext.currentConcepts.join(', ')}`);
            }
            if (learningContext.masteredConcepts?.length > 0) {
                contextParts.push(`Already Mastered: ${learningContext.masteredConcepts.join(', ')}`);
            }
            if (learningContext.strugglingAreas?.length > 0) {
                contextParts.push(`Areas Needing Attention: ${learningContext.strugglingAreas.join(', ')}`);
            }
            if (learningContext.comprehensionLevel !== undefined) {
                contextParts.push(`Comprehension Level: ${Math.round(learningContext.comprehensionLevel * 100)}%`);
            }
            if (learningContext.preferredLearningStyle) {
                contextParts.push(`Learning Style: ${learningContext.preferredLearningStyle}`);
            }
        }

        const fullLearningContext = contextParts.join('\n');

        // Build conversation history context
        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = `
Recent Conversation (Last 3 Messages):
${conversationHistory.map((msg: any) => `${msg.role === 'genie' ? 'Genie' : 'Learner'}: ${msg.content}`).join('\n')}`;
        }

        // Add chat summary for longer conversations
        let summaryContext = '';
        if (chatSummary && chatSummary.trim()) {
            summaryContext = `
${chatSummary}`;
        }

        const systemPrompt = `You are Genie, an enthusiastic AI learning companion conducting an interactive course session.
${userProfileContext}${courseSpecificContext}

LEARNING SESSION CONTEXT:
${fullLearningContext}
${summaryContext}
${conversationContext}

INTERACTIVE COURSE GUIDELINES:
- You are having a real-time conversation with a learner, not just answering questions
- Build naturally on the conversation history and learning context above
- Reference the recent conversation to maintain continuity and avoid repetition
- Use the session summary to understand the broader learning journey
- Adapt your explanations to their comprehension level and learning style
- Reference their mastered concepts to build confidence
- Address struggling areas with patience and alternative approaches
- Use a warm, encouraging tone like a supportive tutor sitting beside them
- Transform any static course content into engaging, conversational explanations
- Connect new concepts to what they already understand from previous discussions
- Ask thoughtful follow-up questions to gauge understanding
- Suggest practice opportunities when appropriate
- Keep responses conversational but substantial (2-4 sentences typically)
- Celebrate progress and provide encouragement
- If the learner asks about something you've already covered, acknowledge it and build upon it rather than repeating

ADAPTIVE RESPONSES:
- For high comprehension (>70%): Introduce advanced concepts, ask deeper questions
- For medium comprehension (30-70%): Reinforce understanding, provide examples
- For low comprehension (<30%): Simplify explanations, use more analogies, break down concepts

Current learner message: "${userMessage}"

Respond as their dedicated learning companion:`;

        // Create a streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Generate the response
                    const result = await generateWithRetry({
                        prompt: userMessage,
                        systemPrompt,
                        temperature: 0.7,
                        maxTokens: 300,
                    });

                    const genieResponse = result.text || "I'm here to help you learn! Could you tell me more about what you'd like to explore?";
                    
                    // Analyze response for metadata
                    const nextAction = analyzeResponseForNextAction(genieResponse, learningContext);
                    const responseType = determineResponseType(genieResponse);

                    // Stream the response word by word for typewriter effect
                    const words = genieResponse.split(' ');
                    
                    for (let i = 0; i < words.length; i++) {
                        const chunk = {
                            type: 'content',
                            content: words[i] + (i < words.length - 1 ? ' ' : ''),
                            isComplete: false
                        };
                        
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        
                        // Add delay for typewriter effect (adjust speed here - lower = faster)
                        await new Promise(resolve => setTimeout(resolve, 25));
                    }

                    // Send completion metadata
                    const completionChunk = {
                        type: 'complete',
                        content: genieResponse,
                        isComplete: true,
                        metadata: {
                            responseType,
                            nextAction,
                            suggestedFollowUp: generateFollowUpSuggestion(nextAction),
                            sessionId,
                            timestamp: new Date().toISOString(),
                            contextUsed: {
                                currentTopic,
                                comprehensionLevel: learningContext?.comprehensionLevel,
                                conceptsCount: learningContext?.currentConcepts?.length || 0
                            }
                        }
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(completionChunk)}\n\n`));
                    controller.close();

                } catch (error) {
                    console.error('Streaming error:', error);
                    const errorChunk = {
                        type: 'error',
                        content: "I'm having trouble processing that. Could you try rephrasing your question?",
                        isComplete: true,
                        error: true
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Interactive Course Streaming Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to get interactive course response' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Analyze Genie response to determine next action in learning flow
 */
function analyzeResponseForNextAction(response: string, learningContext: any): string {
    const responseLower = response.toLowerCase();
    
    // Check for assessment indicators
    if (responseLower.includes('question') || responseLower.includes('check') || 
        responseLower.includes('understand') || responseLower.includes('quiz')) {
        return 'assess_understanding';
    }
    
    // Check for challenge indicators
    if (responseLower.includes('practice') || responseLower.includes('try') || 
        responseLower.includes('challenge') || responseLower.includes('apply')) {
        return 'deliver_challenge';
    }
    
    // Check for topic transition indicators
    if (responseLower.includes('next') || responseLower.includes('move on') || 
        responseLower.includes('ready for')) {
        return 'move_to_next_topic';
    }
    
    // Check comprehension level for automatic progression
    if (learningContext?.comprehensionLevel > 0.8) {
        return 'assess_understanding';
    }
    
    return 'continue_explanation';
}

/**
 * Determine response type based on content analysis
 */
function determineResponseType(response: string): string {
    const responseLower = response.toLowerCase();
    
    if (responseLower.includes('great') || responseLower.includes('excellent') || 
        responseLower.includes('well done') || responseLower.includes('awesome')) {
        return 'encouragement';
    }
    
    if (responseLower.includes('?') && !responseLower.includes('what if')) {
        return 'question';
    }
    
    if (responseLower.includes('challenge') || responseLower.includes('practice')) {
        return 'challenge_intro';
    }
    
    if (responseLower.includes('feedback') || responseLower.includes('result')) {
        return 'feedback';
    }
    
    return 'explanation';
}

/**
 * Generate follow-up suggestion based on next action
 */
function generateFollowUpSuggestion(nextAction: string): string {
    switch (nextAction) {
        case 'assess_understanding':
            return 'Would you like me to check your understanding with a quick question?';
        case 'deliver_challenge':
            return 'Ready to put your knowledge to the test with a challenge?';
        case 'move_to_next_topic':
            return 'Shall we move on to the next concept?';
        default:
            return 'What would you like to explore next?';
    }
}