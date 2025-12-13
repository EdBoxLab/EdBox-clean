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
You are an AI learning path designer. Analyze the user's goal and return a JSON.

Goal: ${goal}
Context: ${context}
${templateText ? `Template guidance:\n${templateText}` : ""}

Return only exact JSON that must contain all : { parsedGoal, domain, targetProficiency, estimatedTotalHours, recommendedEngine }`;

  return callAI(
    systemPrompt,
    goal,
    validateAnalysisResult
  );
}
