import { generateWithRetry, cleanJsonResponse, streamWithFallback } from '@/lib/ai-providers';
import { KnowledgeNode, MasteryRecord, NodeStateMetadata } from './types';
import { VectorBrain } from './vector';
import { Strategist } from './strategist';

export const CognitiveReasoning = {
  /**
   * Orchestrates the V3 pedagogical loop: Strategist Decides -> AI Generates Content
   */
    async determineNextAction(
      userResponse: string,
      currentNode: KnowledgeNode,
      mastery: MasteryRecord | null,
      metadata: NodeStateMetadata,
      conversationHistory: any[] = [],
      forcedDecision?: any
    ) {
      // 1. The Decision (Stateless pure logic)
      const decision = forcedDecision || Strategist.decide(userResponse, currentNode, mastery, metadata, conversationHistory);
  
    // 2. The Content Generation (Thin AI layer)
    const systemPrompt = `You are "Genie", an adaptive cognitive tutor. 
    You have been given a strategic decision by the Brain. Your job is to generate the HIGH-QUALITY content for this decision.

    STRATEGIC DECISION:
    - Action: ${decision.action}
    - Sub-State: ${decision.sub_state}
    - Reason: ${decision.reason}
    - Intensity: ${decision.intensity || 'Normal'}
    - Remediation Flag: ${decision.remediation_flag || 'None'}

    TOPIC CONTEXT:
    - Title: "${currentNode.title}"
    - Content: "${currentNode.content.substring(0, 500)}"
    - Learning Objectives: ${currentNode.learning_objectives?.join(', ') || 'None provided'}

      PEDAGOGICAL RULES:
        1. EXPLAIN: DO NOT be brief. If Sub-State is "DISCOVERY", you are in a "Deep Dive" phase. You MUST provide an extreme in-depth breakdown (minimum 3 paragraphs), use at least 2 distinct analogies, and provide multiple concrete examples. Each "Deep Dive" interaction (up to 10) should peel back a new layer of the concept.
        2. READY_TO_PROGRESS: If Sub-State is "READY_TO_PROGRESS", your "content.text" must congratulate the user on completing the 10-5-3 mastery cycle and explicitly ask if they are ready to move on to the next node in the roadmap.
        3. CHALLENGE: If action is "challenge", use the intensity to scale difficulty. The "content.text" must be a one-sentence hook. The actual task goes in "content.challenge.description".
        4. QUIZ: Focus on a specific objective the user hasn't proven yet.
        5. REVISE: If remediation is active, change your teaching style (e.g., if you used a definition before, use a story now). Provide even more scaffolding and examples. Use Intensity to determine how much help to provide.

    OUTPUT FORMAT:
    Return ONLY a valid JSON object.
    {
      "action": "${decision.action}",
      "thought_process": "${decision.reason}",
      "evaluation_score": number (0-100, analyze user's message),
      "feedback": "Personalized feedback (min 2 sentences)",
      "content": {
        "text": "Intro/Transition text",
        "quiz": { ... },
        "challenge": { ... }
      }
    }`;

    const result = await generateWithRetry({
      prompt: `User Response: "${userResponse}"\nHistory: ${JSON.stringify(conversationHistory.slice(-3))}`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          action: { type: "string" },
          thought_process: { type: "string" },
          evaluation_score: { type: "number" },
          feedback: { type: "string" },
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
                }
              },
              challenge: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  hint: { type: "string" },
                  difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                  expectedOutcome: { type: "string" }
                }
              }
            }
          }
        },
        required: ["action", "content", "evaluation_score"]
      }
    });

    try {
      const parsed = JSON.parse(cleanJsonResponse(result.text));
      return {
        ...parsed,
        sub_state: decision.sub_state, // Pass the strategist's state through
        remediation_flag: decision.remediation_flag
      };
    } catch (e) {
      return {
        action: decision.action,
        sub_state: decision.sub_state,
        content: { text: "Let's keep moving forward with this concept." },
        evaluation_score: 0
      };
    }
  },

  /**
   * Personalized stream for explanations
   */
  async *generatePersonalizedContentStream(node: KnowledgeNode, query: string) {
    const stream = streamWithFallback({
      prompt: `Explain "${node.title}" based on this specific interest: ${query}`,
      systemPrompt: "You are Genie. Be concise and high-impact. Use the node context to teach.",
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
};
