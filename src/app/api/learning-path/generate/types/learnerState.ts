export interface LearnerState {
  id: string;
  userId: string;
  skillGraphId: string;
  skillMastery: Record<string, {
    confidence: number;
    challengesCompleted: number;
    successRate: number;
    timeSpent: number;
    lastPracticed: string | null;
    isMastered: boolean;
  }>;
  currentSkill: string | null;
  streak: number;
  totalXP: number;
  level: number;
  badges: string[];
  startedAt: string;
}
