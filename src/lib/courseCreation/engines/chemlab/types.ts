

export enum ModuleType {
  STOICHIOMETRY = 'Stoichiometry',
  TITRATION = 'Titration',
  MOLECULAR_VIEWER = 'Molecular Viewer',
  PERIODIC_TABLE = 'Periodic Table',
  STATES_OF_MATTER = 'States of Matter',
  CHEMICAL_MIXER = 'Reaction Mixer',
}

export interface Chemical {
  formula: string;
  name: string;
  coefficient: number;
  color: string;
}

export interface Reaction {
  id: string;
  reactants: Chemical[];
  products: Chemical[];
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface TitrationState {
  analyteVolume: number; // mL
  analyteConcentration: number; // M
  titrantConcentration: number; // M
  addedTitrantVolume: number; // mL
  analyteType: 'strong_acid' | 'weak_acid';
  titrantType: 'strong_base';
  pKa?: number; // For weak acid
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  description: string;
  atoms: { x: number; y: number; z: number; element: string }[];
  bonds: { source: number; target: number; order: number }[];
}

export type ElementCategory = 'alkali-metal' | 'alkaline-earth-metal' | 'transition-metal' | 'post-transition-metal' | 'metalloid' | 'non-metal' | 'halogen' | 'noble-gas' | 'lanthanide' | 'actinide' | 'unknown';

export interface PeriodicElement {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category: ElementCategory;
  row: number;
  col: number; // 1-18
  summary: string;
}

export interface MixerChemical {
  id: string;
  name: string;
  formula: string;
  type: 'solid' | 'liquid' | 'gas';
  color: string;
}

export interface MixerRecipe {
  reactants: string[]; // IDs
  products: string[]; // IDs
  resultText: string;
  type: 'precipitation' | 'combustion' | 'neutralization' | 'redox' | 'displacement';
  conditions?: {
    minTemp?: number; // Celsius
    minPressure?: number; // atm
  };
}
