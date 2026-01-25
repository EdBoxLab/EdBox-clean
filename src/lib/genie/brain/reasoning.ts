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
    relatedContext: any[]
  ) {
    const systemPrompt = `You are the "Genie Brain", a cognitive reasoning engine. 
    Analyze the user's response and determining the optimal next pedagogical step.
    
    Current Node: ${currentNode.title}
    Content: ${currentNode.content.substring(0, 500)}...
    Mastery Status: ${mastery?.status || 'not_started'}
    Score: ${mastery?.mastery_score || 0}
    
    Context from Graph: ${JSON.stringify(relatedContext)}
    
    Pedagogical Rules:
    - If mastery > 80: CHALLENGE (Apply knowledge).
    - If mastery < 50: RE-EXPLAIN (Simpler terms).
    - If mastery 50-80: QUIZ (Verify knowledge).
    - If user explicitly asks for Quiz/Challenge: DO IT.
    
    Return a JSON object matching the Schema.`;

    const result = await generateWithRetry({
      prompt: `User Message: "${userResponse}"`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["explain", "quiz", "challenge", "remediate"] },
          thought_process: { type: "string" },
          content: {
            type: "object",
            properties: {
              text: { type: "string", description: "Transition text for explanation or intro" },
              quiz: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctAnswer: { type: "string", description: "Exact string of the correct option" },
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
        required: ["action", "content"]
      }
    });

    return JSON.parse(cleanJsonResponse(result.text));
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
