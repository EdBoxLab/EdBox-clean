import { callAI } from "./callAI";
import { validateAnalysisResult } from "../validators/analysisValidator";
import { LearningContext, EngineType } from "../types/enums";
import { getTemplateContent } from "../utils/templates";

export async function analyzeGoal(
  goal: string,
  context: LearningContext,
  time: string,
  templateName?: string
) {
  const templateText = templateName ? getTemplateContent(templateName) : "";

  const systemPrompt = `
You are an AI learning path architect. Your role is to design a professional,Comprehensive but not overwhelming, competitive curriculum that can rival platforms like Coursera.

Analyze the following:
- Goal: ${goal} make sure each path is tailored to the learner’s specific objective.
-Time Available:${time} Analyze the learner’s available time commitment to ensure the learning path is realistic and achievable.
- Context: ${context} use this to adapt the learning path to the learner’s background and needs.
${templateText ? `- Template guidance:\n${templateText}` : ""} make sure to incorporate relevant elements from the template to enhance the learning path.

Your output must be a detailed JSON object that includes the following fields:

Output requirements:
- Return ONLY valid JSON (no extra text).
- JSON must contain:
  {
    "parsedGoal": string,                 // concise restatement of the learner’s goal
    "domain": string,                     // subject area or discipline
    "targetProficiency": string,          // desired skill level (beginner, intermediate, advanced, expert)
    "estimatedTotalHours": number,        // realistic total hours to reach proficiency
    "recommendedEngine": string,          // best AI/learning engine or resource
    "curriculumModules": [                // breakdown of learning path
      {
        "title": string,
        "description": string,
        "hours": number,
        "resources": [string],            // suggested readings, videos, tools
        "practiceTasks": [string],        // exercises or projects
        "assessment": string              // quiz, project, peer review, etc.
      }
    ],
    "competitiveEdge": string             // how this path differentiates from Coursera/Udemy/etc.
  }

Constraints:
- Ensure modules are sequential, building from fundamentals to mastery.
- Tailor recommendations to the learner’s context.
- Keep JSON clean, consistent, and production‑ready.`;

  return callAI(
    systemPrompt,
    goal,
    validateAnalysisResult
  );
}
