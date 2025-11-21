export enum TierType {
  STUDENT = 'studentEdition',
  MEDICAL = 'medicalEdition'
}

export interface BioModule {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'core' | 'advanced' | 'clinical';
  topics: string[];
}

export interface TierData {
  id: TierType;
  name: string;
  modules: string[]; // List of module IDs
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface SimulationDataPoint {
  name: string;
  [key: string]: number | string;
}
