import { SkillPath, MiniProject, MicroSkill } from '@/app/api/learning-path/generate/types/skillGraph';
import { CourseCategory } from './types';

/**
 * Normalizes and validates the skill graph data from AI
 */
export function normalizeSkillGraphData(data: any): {
  skillPaths: SkillPath[];
  miniProjects: MiniProject[];
  capstoneProject: MiniProject;
} {
  // Handle snake_case vs camelCase and missing fields
  const rawSkillPaths = data.skillPaths || data.skill_paths || data.paths || [];
  const rawMiniProjects = data.miniProjects || data.mini_projects || data.projects || [];
  const rawCapstoneProject = data.capstoneProject || data.capstone_project || data.final_project || null;

  // Ensure skillPaths is an array and has skills
  const normalizedPaths = Array.isArray(rawSkillPaths) ? rawSkillPaths.map((path: any) => ({
    id: path.id || `path_${Math.random().toString(36).substr(2, 9)}`,
    name: path.name || path.title || 'Unnamed Path',
    description: path.description || '',
    skills: Array.isArray(path.skills || path.micro_skills || path.microSkills) 
      ? (path.skills || path.micro_skills || path.microSkills).map((skill: any) => ({
          id: skill.id || `skill_${Math.random().toString(36).substr(2, 9)}`,
          name: skill.name || skill.title || 'Unnamed Skill',
          description: skill.description || '',
          engine: skill.engine || 'generic',
          estimatedMinutes: skill.estimatedMinutes || skill.estimated_minutes || 5,
          prerequisites: Array.isArray(skill.prerequisites || skill.pre_reqs) ? (skill.prerequisites || skill.pre_reqs) : [],
          masteryThreshold: skill.masteryThreshold || skill.mastery_threshold || {
            minChallenges: 3,
            minConfidence: 0.8,
            minSuccessRate: 0.7
          },
          challengeTypes: Array.isArray(skill.challengeTypes || skill.challenge_types) 
            ? (skill.challengeTypes || skill.challenge_types) 
            : ['multiple_choice'],
          xpReward: skill.xpReward || skill.xp_reward || 100
        }))
      : []
  })) : [];

  // Ensure miniProjects is an array
  const normalizedMiniProjects = Array.isArray(rawMiniProjects) ? rawMiniProjects.map((project: any) => ({
    id: project.id || `project_${Math.random().toString(36).substr(2, 9)}`,
    name: project.name || project.title || 'Unnamed Project',
    description: project.description || '',
    unlocksAfter: Array.isArray(project.unlocksAfter || project.unlocks_after) 
      ? (project.unlocksAfter || project.unlocks_after) 
      : [],
    engine: project.engine || 'generic',
    estimatedMinutes: project.estimatedMinutes || project.estimated_minutes || 15,
    xpReward: project.xpReward || project.xp_reward || 250,
    shareTemplate: project.shareTemplate || project.share_template || ''
  })) : [];

  // Ensure capstoneProject exists
  const normalizedCapstone = rawCapstoneProject ? {
    id: rawCapstoneProject.id || `capstone_${Math.random().toString(36).substr(2, 9)}`,
    name: rawCapstoneProject.name || rawCapstoneProject.title || 'Capstone Project',
    description: rawCapstoneProject.description || '',
    unlocksAfter: Array.isArray(rawCapstoneProject.unlocksAfter || rawCapstoneProject.unlocks_after) 
      ? (rawCapstoneProject.unlocksAfter || rawCapstoneProject.unlocks_after) 
      : [],
    engine: rawCapstoneProject.engine || 'generic',
    estimatedMinutes: rawCapstoneProject.estimatedMinutes || rawCapstoneProject.estimated_minutes || 30,
    xpReward: rawCapstoneProject.xpReward || rawCapstoneProject.xp_reward || 500,
    shareTemplate: rawCapstoneProject.shareTemplate || rawCapstoneProject.share_template || ''
  } : {
    id: `capstone_${Math.random().toString(36).substr(2, 9)}`,
    name: 'Final Capstone Project',
    description: 'Apply all your skills in this final project.',
    unlocksAfter: [],
    engine: 'generic',
    estimatedMinutes: 30,
    xpReward: 500,
    shareTemplate: ''
  };

  return {
    skillPaths: normalizedPaths,
    miniProjects: normalizedMiniProjects,
    capstoneProject: normalizedCapstone
  };
}

export function transformToGraph(
  skillPaths: SkillPath[],
  miniProjects: MiniProject[],
  capstoneProject: MiniProject,
  category: CourseCategory
) {
  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Process all skills from all paths
  if (Array.isArray(skillPaths)) {
    skillPaths.forEach(path => {
      if (path.skills && Array.isArray(path.skills)) {
        path.skills.forEach((skill: MicroSkill) => {
          nodes.push({
            id: skill.id,
            title: skill.name,
            description: skill.description,
            category,
            engine: skill.engine,
            level: 'Beginner', // Default for individual skills
            estimatedMinutes: skill.estimatedMinutes,
            prerequisites: skill.prerequisites || [],
            masteryThreshold: {
              minSuccessRate: skill.masteryThreshold?.minSuccessRate || 0.7,
              challengesRequired: skill.masteryThreshold?.minChallenges || 3
            },
            xpReward: skill.xpReward || 100
          });

          // Add edges for skill prerequisites
          if (skill.prerequisites && Array.isArray(skill.prerequisites)) {
            skill.prerequisites.forEach(prereqId => {
              edges.push({ from: prereqId, to: skill.id });
            });
          }
        });
      }
    });
  }

  // 2. Process mini projects
  if (Array.isArray(miniProjects)) {
    miniProjects.forEach(project => {
      nodes.push({
        id: project.id,
        title: project.name,
        description: project.description,
        category,
        engine: project.engine,
        level: 'Intermediate',
        estimatedMinutes: project.estimatedMinutes,
        prerequisites: project.unlocksAfter || [],
        masteryThreshold: {
          minSuccessRate: 0.8,
          challengesRequired: 1
        },
        xpReward: project.xpReward || 250,
        isProject: true
      });

      // Add edges for project dependencies
      if (project.unlocksAfter && Array.isArray(project.unlocksAfter)) {
        project.unlocksAfter.forEach(prevId => {
          edges.push({ from: prevId, to: project.id });
        });
      }
    });
  }

  // 3. Process capstone project
  if (capstoneProject) {
    nodes.push({
      id: capstoneProject.id,
      title: capstoneProject.name,
      description: capstoneProject.description,
      category,
      engine: capstoneProject.engine,
      level: 'Advanced',
      estimatedMinutes: capstoneProject.estimatedMinutes,
      prerequisites: capstoneProject.unlocksAfter || [],
      masteryThreshold: {
        minSuccessRate: 0.9,
        challengesRequired: 1
      },
      xpReward: capstoneProject.xpReward || 500,
      isProject: true,
      isCapstone: true
    });

    // Add edges for capstone dependencies
    if (capstoneProject.unlocksAfter && Array.isArray(capstoneProject.unlocksAfter)) {
      capstoneProject.unlocksAfter.forEach(prevId => {
        edges.push({ from: prevId, to: capstoneProject.id });
      });
    }
  }

  return { nodes, edges };
}
