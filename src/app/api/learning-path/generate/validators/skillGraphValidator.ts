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

  if (!Array.isArray(data.skillPaths)) {
    console.error("Validation failed: skillPaths is not an array", data.skillPaths);
    return false;
  }

  if (!Array.isArray(data.miniProjects)) {
    console.error("Validation failed: miniProjects is not an array", data.miniProjects);
    return false;
  }

  if (!data.capstoneProject || typeof data.capstoneProject !== "object") {
    console.error("Validation failed: capstoneProject is missing or invalid", data.capstoneProject);
    return false;
  }

  const validEngines = Object.values(EngineType).map(String);
  console.log("DEBUG: validEngines array:", validEngines);

  const validateNode = (n: any, idx: number) => {
    console.log(`DEBUG: Validating Node[${idx}]:`, JSON.stringify(n, null, 2));
    
    if (!validEngines.includes(String(n.engine))) {
      console.error(`Node[${idx}] validation failed: engine is invalid`, n.engine, "Valid engines:", validEngines);
      return false;
    }
    if (typeof n.id !== "string") {
      console.error(`Node[${idx}] validation failed: id is not a string`, n.id, "type:", typeof n.id);
      return false;
    }
    if (typeof n.name !== "string") {
      console.error(`Node[${idx}] validation failed: name is not a string`, n.name, "type:", typeof n.name);
      return false;
    }
    if (typeof n.title !== "string") {
      console.error(`Node[${idx}] validation failed: title is not a string`, n.title, "type:", typeof n.title);
      return false;
    }
    if (typeof n.description !== "string") {
      console.error(`Node[${idx}] validation failed: description is not a string`, n.description, "type:", typeof n.description);
      return false;
    }
    if (!Array.isArray(n.prereqs)) {
      console.error(`Node[${idx}] validation failed: prereqs is not an array`, n.prereqs, "type:", typeof n.prereqs);
      return false;
    }
    if (typeof n.estimatedMinutes !== "number") {
      console.error(`Node[${idx}] validation failed: estimatedMinutes is not a number`, n.estimatedMinutes, "type:", typeof n.estimatedMinutes);
      return false;
    }
    if (typeof n.xpReward !== "number") {
      console.error(`Node[${idx}] validation failed: xpReward is not a number`, n.xpReward, "type:", typeof n.xpReward);
      return false;
    }
    console.log(`DEBUG: Node[${idx}] validation passed`);
    return true;
  };

  const validateProject = (p: any, idx: number, type: string) => {
    console.log(`DEBUG: Validating ${type}[${idx}]:`, JSON.stringify(p, null, 2));
    
    if (!validEngines.includes(String(p.engine))) {
      console.error(`${type}[${idx}] validation failed: engine is invalid`, p.engine, "Valid engines:", validEngines);
      return false;
    }
    if (typeof p.id !== "string") {
      console.error(`${type}[${idx}] validation failed: id is not a string`, p.id, "type:", typeof p.id);
      return false;
    }
    if (typeof p.name !== "string") {
      console.error(`${type}[${idx}] validation failed: name is not a string`, p.name, "type:", typeof p.name);
      return false;
    }
    if (typeof p.title !== "string") {
      console.error(`${type}[${idx}] validation failed: title is not a string`, p.title, "type:", typeof p.title);
      return false;
    }
    if (typeof p.description !== "string") {
      console.error(`${type}[${idx}] validation failed: description is not a string`, p.description, "type:", typeof p.description);
      return false;
    }
    if (!Array.isArray(p.skills)) {
      console.error(`${type}[${idx}] validation failed: skills is not an array`, p.skills, "type:", typeof p.skills);
      return false;
    }
    if (typeof p.estimatedMinutes !== "number") {
      console.error(`${type}[${idx}] validation failed: estimatedMinutes is not a number`, p.estimatedMinutes, "type:", typeof p.estimatedMinutes);
      return false;
    }
    if (typeof p.xpReward !== "number") {
      console.error(`${type}[${idx}] validation failed: xpReward is not a number`, p.xpReward, "type:", typeof p.xpReward);
      return false;
    }
    console.log(`DEBUG: ${type}[${idx}] validation passed`);
    return true;
  };

  console.log("DEBUG: Starting skillPaths validation...");
  const nodeValidationResult = data.skillPaths.every((n: any, i: number) => validateNode(n, i));
  console.log("DEBUG: SkillPaths validation result:", nodeValidationResult);
  if (!nodeValidationResult) return false;

  console.log("DEBUG: Starting miniProject validation...");
  const miniProjectValidationResult = data.miniProjects.every((p: any, i: number) => validateProject(p, i, "miniProject"));
  console.log("DEBUG: MiniProject validation result:", miniProjectValidationResult);
  if (!miniProjectValidationResult) return false;

  console.log("DEBUG: Starting capstoneProject validation...");
  const capstoneValidationResult = validateProject(data.capstoneProject, 0, "capstoneProject");
  console.log("DEBUG: CapstoneProject validation result:", capstoneValidationResult);
  if (!capstoneValidationResult) return false;

  console.log("DEBUG: All validations passed!");
  return true;
}
