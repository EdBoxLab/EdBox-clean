export enum LearningContext {
  HighSchool = "high_school",
  College = "college",
  JobSeeking = "job_seeking",
  BuildingProjects = "building_projects"
}

export interface ContextOption {
  id: LearningContext;
  icon: string;
  title: string;
  subtitle: string;
}

export interface TimeOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export interface OnboardingState {
  step: number;
  goal: string;
  context: LearningContext | null;
  timeAvailable: string | null;
  uploadedFile: File | null;
  isGenerating: boolean;
  generationStep: string;
  error: string;
  showContinue: boolean;
}