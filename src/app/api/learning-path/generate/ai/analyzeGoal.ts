import { callAI } from "./callAI";
import { validateAnalysisResult } from "../validators/analysisValidator";
import { LearningContext, EngineType } from "../types/enums";
import { getTemplateContent } from "../utils/templates";

export async function analyzeGoal(
  goal: string,
  context: LearningContext,
  templateName?: string
) {
  const templateText = templateName ? getTemplateContent(templateName) : "";

  const systemPrompt = `
You are an AI learning path architect. Your role is to design a professional, competitive curriculum that can rival platforms like Coursera.

Analyze the following:
- Goal: ${goal}
- Context: ${context}
${templateText ? `- Template guidance:\n${templateText}` : ""}

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
