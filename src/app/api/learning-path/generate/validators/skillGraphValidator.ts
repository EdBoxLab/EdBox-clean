import { EngineType } from "../types/enums";

export function validateSkillGraphResult(data: any): boolean {
  if (!data || typeof data !== "object") {
    console.error("Validation failed: data is not an object", data);
    return false;
  }

  if (typeof data.goal !== "string") {
    console.error("Validation failed: goal is missing or not a string", data.goal);
    return false;
  }

  if (!Array.isArray(data.nodes)) {
    console.error("Validation failed: nodes is not an array", data.nodes);
    return false;
  }

  if (!Array.isArray(data.miniProjects)) {
    console.error("Validation failed: miniProjects is not an array", data.miniProjects);
    return false;
  }

  if (!data.capstone || typeof data.capstone !== "object") {
    console.error("Validation failed: capstone is missing or invalid", data.capstone);
    return false;
  }

  const validEngines = Object.values(EngineType).map(String);

  const validateNode = (n: any, idx: number) => {
    if (!validEngines.includes(String(n.engine))) {
      console.error(`Node[${idx}] validation failed: engine is invalid`, n.engine, "Valid engines:", validEngines);
      return false;
    }
    if (typeof n.id !== "string") {
      console.error(`Node[${idx}] validation failed: id is not a string`, n.id);
      return false;
    }
    if (typeof n.title !== "string") {
      console.error(`Node[${idx}] validation failed: title is not a string`, n.title);
      return false;
    }
    if (typeof n.description !== "string") {
      console.error(`Node[${idx}] validation failed: description is not a string`, n.description);
      return false;
    }
    if (!Array.isArray(n.prereqs)) {
      console.error(`Node[${idx}] validation failed: prereqs is not an array`, n.prereqs);
      return false;
    }
    if (typeof n.estimatedMinutes !== "number") {
      console.error(`Node[${idx}] validation failed: estimatedMinutes is not a number`, n.estimatedMinutes);
      return false;
    }
    if (typeof n.xpReward !== "number") {
      console.error(`Node[${idx}] validation failed: xpReward is not a number`, n.xpReward);
      return false;
    }
    return true;
  };

  const validateProject = (p: any, idx: number, type: string) => {
    if (!validEngines.includes(String(p.engine))) {
      console.error(`${type}[${idx}] validation failed: engine is invalid`, p.engine, "Valid engines:", validEngines);
      return false;
    }
    if (typeof p.id !== "string") {
      console.error(`${type}[${idx}] validation failed: id is not a string`, p.id);
      return false;
    }
    if (typeof p.title !== "string") {
      console.error(`${type}[${idx}] validation failed: title is not a string`, p.title);
      return false;
    }
    if (typeof p.description !== "string") {
      console.error(`${type}[${idx}] validation failed: description is not a string`, p.description);
      return false;
    }
    if (!Array.isArray(p.skills)) {
      console.error(`${type}[${idx}] validation failed: skills is not an array`, p.skills);
      return false;
    }
    if (typeof p.estimatedMinutes !== "number") {
      console.error(`${type}[${idx}] validation failed: estimatedMinutes is not a number`, p.estimatedMinutes);
      return false;
    }
    if (typeof p.xpReward !== "number") {
      console.error(`${type}[${idx}] validation failed: xpReward is not a number`, p.xpReward);
      return false;
    }
    return true;
  };

  if (!data.nodes.every((n: any, i: number) => validateNode(n, i))) return false;
  if (!data.miniProjects.every((p: any, i: number) => validateProject(p, i, "miniProject"))) return false;
  if (!validateProject(data.capstone, 0, "capstone")) return false;

  return true;
}
