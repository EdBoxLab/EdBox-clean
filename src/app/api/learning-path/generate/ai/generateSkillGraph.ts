import { callAI } from "./callAI";
import { validateSkillGraphResult } from "../validators/skillGraphValidator";
import { EngineType } from "../types/enums";

// ------------------------------------
// Types expected by UI + DB
// ------------------------------------
export type SkillNode = {
  id: string;
  title: string;
  description: string;
  prereqs: string[];
  engine: EngineType;
  estimatedMinutes: number;
  xpReward: number;
};

export type MiniProjectNode = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  engine: EngineType;
  estimatedMinutes: number;
  xpReward: number;
};

export type CapstoneNode = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  engine: EngineType;
  estimatedMinutes: number;
  xpReward: number;
};

export type SkillGraphData = {
  goal: string;
  skillPaths: SkillNode[];
  miniProjects: MiniProjectNode[];
  capstoneProject: CapstoneNode;
};

// ------------------------------------
// JSON extraction helper
// ------------------------------------
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
    }

    if (ch === '"') inString = true;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
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
    const extracted = extractFirstJsonObject(text);
    if (!extracted) throw new Error("No JSON object found in AI response");
    return JSON.parse(extracted);
  }
}

// ------------------------------------
// Helpers
// ------------------------------------
const normalizeArray = (val: any): string[] =>
  Array.isArray(val) ? val.map(String) : [];

/**
 * Normalizes engine names to valid EngineType enum values
 * Handles case-insensitive mapping and provides fallback behavior
 */
export function normalizeEngine(engine: string): EngineType {
  if (!engine || typeof engine !== 'string') {
    console.warn("Invalid engine input, defaulting to FinLab:", engine);
    return EngineType.FinLab;
  }

  const normalized = engine.trim().toLowerCase();
  
  // Direct enum value mapping (case-insensitive)
  switch (normalized) {
    case 'codestudio':
      return EngineType.CodeStudio;
    case 'lingualab':
      return EngineType.LinguaLab;
    case 'artstudio':
      return EngineType.ArtStudio;
    case 'historymach':
      return EngineType.HistoryMach;
    case 'physicsengine':
      return EngineType.PhysicsEngine;
    case 'chemlab':
      return EngineType.ChemLab;
    case 'mathlab':
      return EngineType.MathLab;
    case 'finlab':
      return EngineType.FinLab;
    case 'writingstudio':
      return EngineType.WritingStudio;
    
    // AI-generated format aliases
    case 'language':
    case 'languagelab':
      return EngineType.LinguaLab;
    case 'coding':
    case 'code':
      return EngineType.CodeStudio;
    case 'art':
      return EngineType.ArtStudio;
    case 'history':
      return EngineType.HistoryMach;
    case 'physics':
      return EngineType.PhysicsEngine;
    case 'chemistry':
    case 'chem':
      return EngineType.ChemLab;
    case 'math':
    case 'mathematics':
      return EngineType.MathLab;
    case 'finance':
    case 'financial':
    case 'default':
      return EngineType.FinLab;
    case 'writing':
      return EngineType.WritingStudio;
    
    default:
      console.warn("Unknown engine string, defaulting to FinLab:", engine);
      return EngineType.FinLab;
  }
}

// ------------------------------------
// MAIN GENERATOR
// ------------------------------------
export async function generateSkillGraph(
  goal: string,
  domain: string,
  templatePath?: string
): Promise<SkillGraphData> {
  const systemPrompt = `
You are an expert curriculum designer.

CRITICAL RULES:
- Return ONLY valid JSON (no markdown, no explanations).
- Every skill MUST include an engine.- For each node, miniProject, and capstone, the "engine" field MUST be selected from this fixed set:
  ["LinguaLab","CodeStudio","MathLab","FinLab"]
- Do not invent, lowercase, or alter these values. Copy them exactly as written.

- Do NOT omit any required field.
- All arrays MUST be valid JSON arrays of strings.
  Example: "prereqs": ["skill1","skill2"], NOT [Array].
- Never use placeholders like [Array], null, or undefined.
- Ensure the JSON parses successfully with JSON.parse().
`;


const userPrompt = `
Generate a full learning skill graph.

Use EXACT JSON SHAPE:

{
  "goal": "string",
  "nodes": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "prereqs": ["skillId"],
      "engine": "LinguaLab | CodeStudio | MathLab | FinLab",  // CASE-SENSITIVE
      "estimatedMinutes": number,
      "xpReward": number
    }
  ],
  "miniProjects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "skills": ["skillId"],
      "engine": "LinguaLab | CodeStudio | MathLab | FinLab",  // CASE-SENSITIVE
      "estimatedMinutes": number,
      "xpReward": number
    }
  ],
  "capstone": {
    "id": "string",
    "title": "string",
    "description": "string",
    "skills": ["skillId"],
    "engine": "LinguaLab | CodeStudio | MathLab | FinLab",  // CASE-SENSITIVE
    "estimatedMinutes": number,
    "xpReward": number
  }
}

Goal: ${goal}
Domain: ${domain}

Return VALID JSON only. No markdown. No explanations. No placeholders.
`.trim();

  try {
    // --- call AI ---
    const raw = await callAI(systemPrompt, userPrompt, (r) => true);

    // --- parse JSON ---
    const parsed = parsePossibleJson(raw);

    // --- normalize nodes ---
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      const validIds = new Set(parsed.nodes.map((n: any) => String(n.id)));
      console.dir(parsed, { depth: null });

      parsed.skillPaths = parsed.nodes.map((n: any, i: number, arr: any[]) => {
        const prereqs =
          normalizeArray(n.prereqs).length > 0
            ? normalizeArray(n.prereqs).filter((id) => validIds.has(id))
            : i > 0
            ? [String(arr[i - 1].id)]
            : [];

        return {
          id: String(n.id),
          name: String(n.title), // Route expects 'name' not 'title'
          title: String(n.title),
          description: String(n.description),
          prereqs,
          engine: normalizeEngine(String(n.engine)),
          estimatedMinutes: Number(n.estimatedMinutes) || 0,
          xpReward: Number(n.xpReward) || 0,
        };
      });
      
      // Remove the original nodes array
      delete parsed.nodes;
    }

    // --- normalize miniProjects ---
    
if (parsed.miniProjects && Array.isArray(parsed.miniProjects)) {
  parsed.miniProjects = parsed.miniProjects.map((p: any) => ({
    id: String(p.id),
    name: String(p.title), // Route expects 'name' not 'title'
    title: String(p.title),
    description: String(p.description),
    skills: normalizeArray(p.skills),
    engine: normalizeEngine(String(p.engine)), // <-- FIXED
    estimatedMinutes: Number(p.estimatedMinutes) || 0,
    xpReward: Number(p.xpReward) || 0,
  }));
}

// --- normalize capstone ---
if (parsed.capstone) {
  const c = parsed.capstone;
  parsed.capstoneProject = {
    id: String(c.id),
    name: String(c.title), // Route expects 'name' not 'title'
    title: String(c.title),
    description: String(c.description),
    skills: normalizeArray(c.skills),
    engine: normalizeEngine(String(c.engine)), // <-- FIXED
    estimatedMinutes: Number(c.estimatedMinutes) || 0,
    xpReward: Number(c.xpReward) || 0,
  };
  
  // Remove the original capstone field
  delete parsed.capstone;
}
console.dir(parsed, { depth: null });
parsed.skillPaths?.forEach((n: any, i: number) => {
  console.log(`Node[${i}] engine:`, n.engine, typeof n.engine);
});
parsed.miniProjects?.forEach((p: any, i: number) => {
  console.log(`Project[${i}] engine:`, p.engine, typeof p.engine);
});
console.log("Capstone engine:", parsed.capstoneProject?.engine, typeof parsed.capstoneProject?.engine);

    // --- final validation ---
    if (!validateSkillGraphResult(parsed)) {
      throw new Error("Skill graph validation failed");
    }

    return parsed as SkillGraphData;
  } catch (error) {
    throw new Error(
      `Skill graph generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
