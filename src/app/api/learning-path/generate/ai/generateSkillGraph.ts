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
  nodes: SkillNode[];
  miniProjects: MiniProjectNode[];
  capstone: CapstoneNode;
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
const engineMap: Record<string, EngineType> = {
  Language: EngineType.LinguaLab,
  LinguaLab: EngineType.LinguaLab,
  Coding: EngineType.CodeStudio,
  CodeStudio: EngineType.CodeStudio,
  Math: EngineType.MathLab,
  MathLab: EngineType.MathLab,
  Default: EngineType.FinLab,
  FinLab: EngineType.FinLab,
  mathlab:EngineType.MathLab,
  finlab:EngineType.FinLab,
};


const normalizeArray = (val: any): string[] =>
  Array.isArray(val) ? val.map(String) : [];

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
function normalizeEngine(engine: string): EngineType {
  const key = engine.trim().toLowerCase();
  switch (key) {
    case "languagelab":
      return EngineType.LinguaLab;
    case "language":
      return EngineType.LinguaLab;
    case "codestudio":
            return EngineType.CodeStudio;
    case "coding":
      return EngineType.CodeStudio;
    case "mathlab":
       return EngineType.MathLab;
    case "math":
      return EngineType.MathLab;
    case "finlab":
            return EngineType.FinLab;
    case "default":
      return EngineType.FinLab;
    default:
      console.warn("Unknown engine string, defaulting to FinLab:", engine);
      return EngineType.FinLab;
  }
}

    // --- normalize nodes ---
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      const validIds = new Set(parsed.nodes.map((n: any) => String(n.id)));
      console.dir(parsed, { depth: null });

      parsed.nodes = parsed.nodes.map((n: any, i: number, arr: any[]) => {
        const prereqs =
          normalizeArray(n.prereqs).length > 0
            ? normalizeArray(n.prereqs).filter((id) => validIds.has(id))
            : i > 0
            ? [String(arr[i - 1].id)]
            : [];

        return {
          id: String(n.id),
          title: String(n.title),
          description: String(n.description),
          prereqs,
          engine: normalizeEngine(String(n.engine)),
          estimatedMinutes: Number(n.estimatedMinutes) || 0,
          xpReward: Number(n.xpReward) || 0,
        };
      });
    }

    // --- normalize miniProjects ---
    
if (parsed.miniProjects && Array.isArray(parsed.miniProjects)) {
  parsed.miniProjects = parsed.miniProjects.map((p: any) => ({
    id: String(p.id),
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
  parsed.capstone = {
    id: String(c.id),
    title: String(c.title),
    description: String(c.description),
    skills: normalizeArray(c.skills),
    engine: normalizeEngine(String(c.engine)), // <-- FIXED
    estimatedMinutes: Number(c.estimatedMinutes) || 0,
    xpReward: Number(c.xpReward) || 0,
  };
}
console.dir(parsed, { depth: null });
parsed.nodes.forEach((n: any, i: number) => {
  console.log(`Node[${i}] engine:`, n.engine, typeof n.engine);
});
parsed.miniProjects.forEach((p: any, i: number) => {
  console.log(`Project[${i}] engine:`, p.engine, typeof p.engine);
});
console.log("Capstone engine:", parsed.capstone.engine, typeof parsed.capstone.engine);

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
