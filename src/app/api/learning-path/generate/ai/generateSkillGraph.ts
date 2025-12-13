import { callAI } from "./callAI";
import { validateSkillGraphResult } from "../validators/skillGraphValidator";

// -------------------------------
// 1️⃣ Types
// -------------------------------
export type SkillPath = {
  id: string;
  name: string;
  prereqs: string[];
};

export type MiniProject = {
  id: string;
  name: string;
  skills: string[];
};

export type CapstoneProject = {
  id: string;
  name: string;
  skills: string[];
};

export type SkillGraphData = {
  skillPaths: SkillPath[];
  miniProjects: MiniProject[];
  capstoneProject: CapstoneProject;
};

// -------------------------------
// 2️⃣ Helper: extract JSON from text
// -------------------------------
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    } else {
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }
  }

  return null;
}

function parsePossibleJson(raw: unknown): any {
  if (typeof raw === "object" && raw !== null) return raw;

  const text = String(raw ?? "");
  try {
    return JSON.parse(text);
  } catch {
    const objText = extractFirstJsonObject(text);
    if (!objText) throw new Error("No JSON object found in AI response");
    return JSON.parse(objText);
  }
}

// -------------------------------
// 3️⃣ Generate skill graph
// -------------------------------
export async function generateSkillGraph(
  goal: string,
  domain: string,
  templatePath?: string
): Promise<SkillGraphData> {
  const systemPrompt = `You are an expert curriculum designer. You MUST return only valid JSON.`;
  const userPrompt = `
Generate a full skill graph in JSON.

The JSON MUST have this exact shape:
{
  "skillPaths": [{ "id": "string", "name": "string", "prereqs": ["skillId", ...] }],
  "miniProjects": [{ "id": "string", "name": "string", "skills": ["skillId", ...] }],
  "capstoneProject": { "id": "string", "name": "string", "skills": ["skillId", ...] }
}

Goal: ${goal}
Domain: ${domain}
Template: ${templatePath ?? 'none'}

Respond with JSON only. No markdown fences, no commentary.
`.trim();

  try {
    // Strict call
    const strictRaw = await callAI(systemPrompt, userPrompt, validateSkillGraphResult);
    console.log("✅ AI raw response (strict):", JSON.stringify(strictRaw, null, 2));

    const parsedStrict = parsePossibleJson(strictRaw);
    if (!validateSkillGraphResult(parsedStrict)) {
      throw new Error("AI response failed validation after strict call");
    }
    return parsedStrict as SkillGraphData;
  } catch (err) {
    console.warn("⚠️ Strict AI call failed, attempting fallback:", err);

    try {
      // Fallback: permissive
      const fallbackRaw = await callAI(
        systemPrompt,
        userPrompt + "\n\n(Ensure JSON object is included in your response.)",
        () => true
      );

      console.log("⚠️ AI raw response (fallback):", JSON.stringify(fallbackRaw, null, 2));

      const parsedFallback = parsePossibleJson(fallbackRaw);

      if (!validateSkillGraphResult(parsedFallback)) {
        throw new Error(
          `Extracted JSON failed validation. Raw AI response:\n${JSON.stringify(fallbackRaw, null, 2)}`
        );
      }

      return parsedFallback as SkillGraphData;
    } catch (fallbackErr) {
      throw new Error(
        `Failed to obtain valid skill graph from AI. Details: ${
          fallbackErr instanceof Error ? fallbackErr.message : JSON.stringify(fallbackErr)
        }`
      );
    }
  }
}
