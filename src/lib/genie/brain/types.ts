export type MasteryLevel = 1 | 2 | 3 | 4 | 5;

export interface KnowledgeNode {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  level: number;
  order_index: number;
  prerequisite_ids: string[];
  learning_objectives: string[];
  passing_criteria: {
    type: 'challenge' | 'quiz' | 'hybrid';
    requirement: string;
    threshold: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MasteryRecord {
  id: string;
  user_id: string;
  node_id: string;
  mastery_score: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  attempts_count: number;
  last_attempt_at: string;
}

export interface NodeStateMetadata {
  sub_state: 'DISCOVERY' | 'APPLICATION' | 'VALIDATION' | 'READY_TO_PROGRESS';
  explanation_count: number;
  interaction_count: number;
  quizzes_completed: number;
  challenges_completed: number;
  mastery_velocity: number;
  remediation_flag: boolean;
  objectives_covered: string[];
}

export interface LearningSession {
  id: string;
  course_id: string;
  user_id: string;
  current_topic: string | null;
  learning_context: Record<string, any>;
  progress_state: {
    history?: any[];
    node_metadata?: Record<string, NodeStateMetadata>;
    current_velocity?: number;
  };
  session_start_time: string;
  last_interaction: string;
  is_active: boolean;
  retry_count: number;
}

export interface LearningLoopIteration {
  id: string;
  session_id: string;
  iteration_number: number;
  concept: string;
  explanation_completed: boolean;
  assessment_completed: boolean;
  challenge_completed: boolean;
  evaluation_completed: boolean;
  mastery_achieved: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface UnderstandingAssessment {
  id: string;
  session_id: string;
  concept: string;
  question_type: 'multiple_choice' | 'short_answer' | 'true_false' | 'drag_drop';
  question_data: any;
  learner_response: string | null;
  is_correct: boolean | null;
  comprehension_level: number | null;
  feedback: string | null;
  created_at: string;
  answered_at: string | null;
}

export interface UserCompetency {
  id: string;
  user_id: string;
  topic: string;
  concept: string;
  confidence: number;
  mastery_state: Record<string, any>;
  last_updated: string;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_id: string;
  challenges_completed: number;
  challenges_required: number;
  success_rate: number;
  mastery_achieved: boolean;
  last_attempt: string | null;
  total_attempts: number;
  xp_earned: number;
}

export interface LearnerState {
  id: string;
  user_id: string;
  skill_graph_id: string;
  total_xp: number;
  level: number;
  streak: number;
  badges: any[];
  last_active: string;
  skill_mastery: Record<string, any>;
  current_skill: string | null;
  started_at: string | null;
}

export interface SkillGraph {
  id: string;
  user_id: string;
  goal: string;
  nodes: any;
  edges: any;
  context: any;
  total_skills: number;
  estimated_hours: string;
  skill_paths: any;
  mini_projects: any;
  capstone_project: any;
}

export interface VectorMatch {
  id: string;
  node_id: string;
  content: string;
  similarity: number;
}
