export function validateSkillGraphResult(result: any): boolean {
  return (
    result &&
    Array.isArray(result.skillPaths) &&
    Array.isArray(result.miniProjects) &&
    typeof result.capstoneProject === 'object'
  );
}
