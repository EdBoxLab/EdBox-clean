import { KnowledgeNode, MasteryRecord, NodeStateMetadata, LearningSession } from './types';

export const Strategist = {
  /**
   * Calculates Mastery Velocity: Change in mastery per interaction
   */
  calculateVelocity(
    currentMastery: number,
    previousMastery: number,
    interactionCount: number
  ): number {
    if (interactionCount === 0) return 0;
    return (currentMastery - previousMastery) / interactionCount;
  },

  /**
   * Pure logic engine to determine the next pedagogical action
   */
    decide(
      userResponse: string,
      node: KnowledgeNode,
      mastery: MasteryRecord | null,
      metadata: NodeStateMetadata,
      history: any[] = []
    ) {
      const lowerInput = userResponse.toLowerCase();

      // 0. Handle Progression Confirmation
      if (metadata.sub_state === 'READY_TO_PROGRESS') {
        const affirmative = ['yes', 'yeah', 'ready', 'next', 'move on', 'ok', 'sure', 'go ahead', 'yep'];
        if (affirmative.some(word => lowerInput.includes(word))) {
          return { action: 'advance', sub_state: 'DISCOVERY', reason: 'User confirmed readiness to progress.' };
        }
        return { 
          action: 'explain', 
          sub_state: 'READY_TO_PROGRESS', 
          reason: 'User not ready or asked something else. Staying in confirmation.',
          intensity: 5
        };
      }

      // 1. Explicit User Intent (Overrides)
      if (lowerInput.includes('quiz')) {
        return { action: 'quiz', sub_state: 'VALIDATION', reason: 'User explicitly requested a quiz.' };
      }
      if (lowerInput.includes('challenge')) {
        return { action: 'challenge', sub_state: 'APPLICATION', reason: 'User explicitly requested a challenge.' };
      }

      const isVague = this.isVagueInput(userResponse);
      const masteryScore = mastery?.mastery_score || 0;
      
      // 2. V3 "10-5-3" DETERMINISTIC FLOW
      switch (metadata.sub_state) {
        case 'DISCOVERY':
          // 10 Deep Dives (Explanations)
          if (metadata.explanation_count < 10) {
            return { 
              action: 'explain', 
              sub_state: 'DISCOVERY', 
              reason: `Deep dive phase (${metadata.explanation_count + 1}/10). Providing extreme depth and analogies.`,
              intensity: 9 // Force high depth
            };
          }
          return { action: 'quiz', sub_state: 'VALIDATION', reason: 'Foundational depth achieved. Moving to validation.' };

        case 'VALIDATION':
          // 5 Quizzes
          if (metadata.quizzes_completed < 5) {
            return { 
              action: 'quiz', 
              sub_state: 'VALIDATION', 
              reason: `Validation phase (${metadata.quizzes_completed + 1}/5). Testing conceptual nuances.` 
            };
          }
          return { action: 'challenge', sub_state: 'APPLICATION', reason: 'Validation successful. Moving to interactive application.' };

        case 'APPLICATION':
          // 3 Challenges
          if (metadata.challenges_completed < 3) {
            return { 
              action: 'challenge', 
              sub_state: 'APPLICATION', 
              reason: `Application phase (${metadata.challenges_completed + 1}/3). Driving toward mastery through practice.`,
              intensity: 7
            };
          }
          return { 
            action: 'explain', 
            sub_state: 'READY_TO_PROGRESS', 
            reason: '10-5-3 Loop completed. Requesting user confirmation to advance.' 
          };

        default:
          return { action: 'explain', sub_state: 'DISCOVERY', reason: 'Defaulting to discovery loop.' };
      }
    },

  /**
   * Determines if input is vague/affirmative
   */
  isVagueInput(input: string): boolean {
    const vaguePatterns = [
      /^ok$/i, /^okay$/i, /^yes$/i, /^yeah$/i, /^cool$/i, /^understood$/i, 
      /^go on$/i, /^i see$/i, /^uhm$/i, /^next$/i, /^i get it$/i, /^sure$/i
    ];
    return vaguePatterns.some(pattern => pattern.test(input.trim()));
  },

  /**
   * Calculates intensity for challenges (1-10)
   */
  calculateIntensity(velocity: number, score: number): number {
    let intensity = 5;
    if (velocity > 15) intensity += 2;
    if (velocity < 5) intensity -= 1;
    if (score > 80) intensity += 2;
    if (score < 40) intensity -= 2;
    return Math.max(1, Math.min(10, intensity));
  }
};
