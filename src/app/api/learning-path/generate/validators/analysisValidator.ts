export function validateAnalysisResult(result: any): boolean {
  if (!result || typeof result !== 'object') return false;

  const required = [
    'parsedGoal',
    'domain',
    'targetProficiency',
    'estimatedTotalHours',
    'recommendedEngine'
  ];

  return required.every(k => result[k]);
}
