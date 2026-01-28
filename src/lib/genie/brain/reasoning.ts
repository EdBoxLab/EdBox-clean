import { generateWithRetry, cleanJsonResponse, streamWithFallback } from '@/lib/ai-providers';
import { KnowledgeNode, MasteryRecord } from './types';
import { VectorBrain } from './vector';

export const CognitiveReasoning = {
  /**
   * Decides the next action for the learner based on their current state and performance
   */
  async determineNextAction(
    userResponse: string,
    currentNode: KnowledgeNode,
    mastery: MasteryRecord | null,
    relatedContext: any[],
    conversationHistory: any[] = []
  ) {
    const systemPrompt = `You are the "Genie Brain", a cognitive reasoning engine for an adaptive tutor. 
        Your goal is to analyze the user's state and determine the single best pedagogical next step.

        Current State:
        - Topic: "${currentNode.title}"
        - Mastery Status: ${mastery?.status || 'not_started'}
        - Mastery Score: ${mastery?.mastery_score || 0}/100
        
          Pedagogical Rules:
          1. INITIALIZATION: If this is the very beginning (no history), choose "roadmap" to show the learner what they will cover.
          2. VAGUE RESPONSES: If the user says something vague or affirmative (e.g., "ok", "yes", "uhm", "go on", "I understand") AFTER you've already explained something, DO NOT repeat the explanation. Instead, move to "quiz" or "challenge" to verify mastery, or "roadmap" to show progress.
          3. JUST STARTED: If Mastery Status is "not_started" and you haven't explained yet, choose "explain".
          4. STRUGGLING: If Mastery Score < 50, choose "remediate" or "explain" using simpler terms and metaphors.
          5. COMPETENT: If Mastery Score 50-80, choose "quiz" to verify their mental model.
          6. MASTERING: If Mastery Score > 80, choose "challenge" to encourage higher-order thinking (application/synthesis).
          7. USER REQUEST: If the user explicitly asks for a quiz, challenge, or explanation, honor their request regardless of score.
          8. LOOP ITERATIONS: You are part of a "Learning Loop". Each loop should ideally consist of Explanation -> Assessment (Quiz) -> Challenge -> Evaluation. 

          CRITICAL: 
          - Every interaction should be logged as part of the current "Iteration".
            - When you move to a new concept, it starts a new "Iteration".

            RULES FOR CHALLENGE/QUIZ:
            - If action is "challenge", the "content.text" MUST be a short intro (max 1 sentence) like "Ready to test your skills?". The ACTUAL task must be in "content.challenge.description".
            - If action is "quiz", the "content.text" MUST be a short intro like "Let's check your understanding.". The question must be in "content.quiz.question".


          OUTPUT FORMAT:
        You MUST return ONLY a valid JSON object. Do not include markdown blocks, preambles, or extra text.
          The JSON must follow this exact schema:
          {
            "action": "explain" | "quiz" | "challenge" | "remediate" | "roadmap" | "advance",
            "thought_process": "Brief explanation of your pedagogical choice",
            "evaluation_score": number (0-100, estimate of user's current mastery of this concept based on the response),
            "feedback": "Personalized feedback for the user (at least 2 sentences)",
            "remediation_node_id": "UUID of a prerequisite node if user is struggling (optional)",
            "suggested_explanation": "A specific angle or metaphor to use for the next explanation (optional)",
            "content": {
              "text": "Introductory or transition text (at least 2 sentences)",
            "quiz": {
              "question": "The question string",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "The exact string of the correct option",
              "explanation": "Why this is correct"
            },
            "challenge": {
              "title": "Challenge Name",
              "description": "The task to perform",
              "hint": "A helpful nudge",
              "difficulty": "Easy" | "Medium" | "Hard",
              "expectedOutcome": "What the solution looks like"
            }
          }
        }`;


    const result = await generateWithRetry({
      prompt: `Conversation History:\n${JSON.stringify(conversationHistory.slice(-5))}\n\nUser Message: "${userResponse}"\nTopic Context: ${currentNode.content.substring(0, 300)}`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["explain", "quiz", "challenge", "remediate", "roadmap", "advance"] },
          thought_process: { type: "string" },
          evaluation_score: { type: "number" },
          feedback: { type: "string" },
          remediation_node_id: { type: "string" },
          suggested_explanation: { type: "string" },
          content: {
            type: "object",
            properties: {
              text: { type: "string" },
              quiz: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctAnswer: { type: "string" },
                  explanation: { type: "string" }
                },
                required: ["question", "options", "correctAnswer"]
              },
              challenge: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  hint: { type: "string" },
                  difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                  expectedOutcome: { type: "string" }
                },
                required: ["title", "description", "difficulty"]
              }
            }
          }
        },
        required: ["action", "content", "evaluation_score"]
      }
    });

    try {
      const parsed = JSON.parse(cleanJsonResponse(result.text));

      // Fallback if missing action/content
      if (!parsed.action || !parsed.content) {
        console.warn('[GENIE_BRAIN] AI returned incomplete decision, defaulting to Explain.', parsed);
        return {
          action: 'explain',
          thought_process: 'Fallback due to malformed AI response',
          evaluation_score: 0,
          feedback: "Let's keep going.",
          content: { text: "Let's dive into this topic." }
        };
      }
      return {
        ...parsed,
        evaluation_score: parsed.evaluation_score || 0,
        feedback: parsed.feedback || parsed.content?.text || "Let's continue."
      };

    } catch (e) {
      console.warn('[GENIE_BRAIN] Failed to parse decision JSON, defaulting to Explain.', e);
      return {
        action: 'explain',
        thought_process: 'Fallback due to JSON parse error',
        evaluation_score: 0,
        feedback: "Let's try again.",
        content: { text: "Let's iterate on this concept." }
      };
    }
  },

  /**
   * Generates a personalized explanation based on vector-retrieved context (streaming)
   */
  async *generatePersonalizedContentStream(node: KnowledgeNode, query: string) {
    const relatedContext = await VectorBrain.findRelatedNodes(query);
    const contextText = relatedContext.map(m => m.content).join('\n---\n');

    const stream = streamWithFallback({
      prompt: `Explain the concept "${node.title}" in the context of: ${query}\n\nAdditional Context:\n${contextText}`,
      systemPrompt: "You are Genie, a helpful and adaptive tutor. Use the provided context to make your explanation more relevant to the user's specific interest or query. Be concise but thorough.",
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
};
