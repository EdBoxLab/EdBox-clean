export interface KnowledgeNode {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  level: number;
  prerequisite_ids: string[];
  order_index: number;
}

export interface MasteryRecord {
  user_id: string;
  node_id: string;
  mastery_score: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  attempts_count: number;
  last_attempt_at: string;
}

export interface LearningSession {
  id: string;
  user_id: string;
  course_id: string;
  current_node_id: string | null;
  learning_path: string[];
  is_active: boolean;
  session_data: any;
}

export interface VectorMatch {
  id: string;
  node_id: string;
  content: string;
  similarity: number;
}

export type MasteryLevel = 1 | 2 | 3 | 4 | 5;
