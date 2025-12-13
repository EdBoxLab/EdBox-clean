import { LearningContext, EngineType } from "./enums";

export interface MicroSkill {
  id: string;
  name: string;
  description: string;
  engine: EngineType;
  estimatedMinutes: number;
  prerequisites: string[];
  masteryThreshold: {
    minChallenges: number;
    minConfidence: number;
    minSuccessRate: number;
  };
  challengeTypes: string[];
  xpReward: number;
}

export interface SkillPath {
  id: string;
  name: string;
  description: string;
  skills: MicroSkill[];
}

export interface MiniProject {
  id: string;
  name: string;
  description: string;
  unlocksAfter: string[];
  engine: EngineType;
  estimatedMinutes: number;
  xpReward: number;
  shareTemplate: string;
}

export interface SkillGraph {
  id: string;
  userId: string;
  goal: string;
  context: LearningContext;
  totalSkills: number;
  estimatedHours: string;
  skillPaths: SkillPath[];
  miniProjects: MiniProject[];
  capstone_project: MiniProject;
  nodes: any[];
  edges: any[];
  createdAt: string;
}
