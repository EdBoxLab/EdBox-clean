export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export interface KnowledgeNode {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  level: MasteryLevel;
  prerequisites: string[]; // IDs of other nodes
  created_at: string;
}

export interface UserMastery {
  user_id: string;
  node_id: string;
  mastery_score: number; // 0 to 100
  last_accessed: string;
  attempts: number;
}

export interface LearningSession {
  id: string;
  user_id: string;
  course_id: string;
  current_node_id: string | null;
  learning_path: string[]; // List of node IDs
  is_active: boolean;
  created_at: string;
}

export interface CognitiveState {
  currentNode: KnowledgeNode | null;
  nextNodes: KnowledgeNode[];
  masteryMap: Record<string, number>;
  session: LearningSession;
}

export interface BrainResponse {
  type: 'explanation' | 'challenge' | 'feedback' | 'transition';
  content: string;
  metadata?: any;
}

export interface VectorMatch {
  id: string;
  node_id: string;
  content: string;
  similarity: number;
}

export interface MasteryRecord {
  user_id: string;
  node_id: string;
  mastery_score: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  last_attempt_at: string;
  attempts: number;
}
