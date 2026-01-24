import { generateWithRetry, cleanJsonResponse } from '@/lib/ai-providers';
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
    const systemPrompt = `You are the "Genie Brain", a cognitive reasoning engine for an interactive course. 
    Analyze the user's response to the current concept.
    
    Current Node: ${currentNode.title}
    Content: ${currentNode.content}
    Mastery Status: ${mastery?.status || 'not_started'}
    Score: ${mastery?.mastery_score || 0}
    
    Context from Knowledge Graph: ${JSON.stringify(relatedContext)}
    
    Your goal is to:
    1. Evaluate the user's understanding (0-100).
    2. Provide constructive feedback.
    3. Decide if they should:
       - 'advance': Move to the next node (mastery > 80).
       - 're-explain': Explain the concept differently (mastery < 50).
       - 'challenge': Ask a deeper question (mastery 50-80).
       - 'remediate': Go back to a prerequisite node if they are struggling.
    
    Return a JSON object.`;

    const result = await generateWithRetry({
      prompt: `User Response: "${userResponse}"`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          evaluation_score: { type: "number" },
          feedback: { type: "string" },
          next_action: { type: "string", enum: ["advance", "re-explain", "challenge", "remediate"] },
          suggested_explanation: { type: "string" },
          remediation_node_id: { type: "string" }
        },
        required: ["evaluation_score", "feedback", "next_action"]
      }
    });

    return JSON.parse(cleanJsonResponse(result.text));
  },

  /**
   * Generates a personalized explanation based on vector-retrieved context
   */
  async generatePersonalizedContent(node: KnowledgeNode, query: string) {
    const relatedContext = await VectorBrain.findRelatedNodes(query);
    const contextText = relatedContext.map(m => m.content).join('\n---\n');

    const result = await generateWithRetry({
      prompt: `Explain the concept "${node.title}" in the context of: ${query}\n\nAdditional Context:\n${contextText}`,
      systemPrompt: "You are Genie, a helpful and adaptive tutor. Use the provided context to make your explanation more relevant to the user's specific interest or query.",
    });

    return result.text;
  }
};
