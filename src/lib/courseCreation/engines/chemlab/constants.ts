

import { Molecule, Reaction, PeriodicElement, MixerChemical, MixerRecipe } from './types';

export const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  Cl: '#1FF01F',
  Na: '#AB5CF2',
};

export const ELEMENT_RADII: Record<string, number> = {
  H: 10,
  C: 15,
  N: 14,
  O: 14,
  Cl: 18,
  Na: 20,
};

export const SAMPLE_REACTIONS: Reaction[] = [
  {
    id: 'water_formation',
    description: 'Formation of Water',
    difficulty: 'Beginner',
    reactants: [
      { formula: 'H2', name: 'Hydrogen', coefficient: 1, color: '#60a5fa' },
      { formula: 'O2', name: 'Oxygen', coefficient: 1, color: '#f87171' },
    ],
    products: [
      { formula: 'H2O', name: 'Water', coefficient: 1, color: '#3b82f6' },
    ],
  },
  {
    id: 'methane_combustion',
    description: 'Combustion of Methane',
    difficulty: 'Intermediate',
    reactants: [
      { formula: 'CH4', name: 'Methane', coefficient: 1, color: '#4ade80' },
      { formula: 'O2', name: 'Oxygen', coefficient: 1, color: '#f87171' },
    ],
    products: [
      { formula: 'CO2', name: 'Carbon Dioxide', coefficient: 1, color: '#94a3b8' },
      { formula: 'H2O', name: 'Water', coefficient: 1, color: '#3b82f6' },
    ],
  },
  {
    id: 'photosynthesis',
    description: 'Photosynthesis',
    difficulty: 'Advanced',
    reactants: [
      { formula: 'CO2', name: 'Carbon Dioxide', coefficient: 6, color: '#94a3b8' },
      { formula: 'H2O', name: 'Water', coefficient: 6, color: '#3b82f6' },
    ],
    products: [
      { formula: 'C6H12O6', name: 'Glucose', coefficient: 1, color: '#fbbf24' },
      { formula: 'O2', name: 'Oxygen', coefficient: 6, color: '#f87171' },
    ],
  }
];

export const SAMPLE_MOLECULES: Molecule[] = [
  {
    id: 'H2O',
    name: 'Water',
    formula: 'H2O',
    description: 'A polar inorganic compound that is at room temperature a tasteless and odorless liquid, essential for all known forms of life.',
    atoms: [
      { x: 0, y: 0, z: 0, element: 'O' },
      { x: -20, y: 20, z: 0, element: 'H' },
      { x: 20, y: 20, z: 0, element: 'H' }
    ],
    bonds: [
      { source: 0, target: 1, order: 1 },
      { source: 0, target: 2, order: 1 }
    ]
  },
  {
    id: 'CO2',
    name: 'Carbon Dioxide',
    formula: 'CO2',
    description: 'A colorless gas with a density about 53% higher than that of dry air. It consists of a carbon atom covalently double bonded to two oxygen atoms.',
    atoms: [
      { x: 0, y: 0, z: 0, element: 'C' },
      { x: -30, y: 0, z: 0, element: 'O' },
      { x: 30, y: 0, z: 0, element: 'O' }
    ],
    bonds: [
      { source: 0, target: 1, order: 2 },
      { source: 0, target: 2, order: 2 }
    ]
  },
  {
    id: 'NaCl',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    description: 'An ionic compound with the chemical formula NaCl, representing a 1:1 ratio of sodium and chloride ions.',
    atoms: [
      { x: -15, y: 0, z: 0, element: 'Na' },
      { x: 15, y: 0, z: 0, element: 'Cl' }
    ],
    bonds: [
      { source: 0, target: 1, order: 1 } // Ionic representation
    ]
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    formula: 'C8H10N4O2',
    description: 'A central nervous system stimulant of the methylxanthine class.',
    atoms: [
        // Simplified 2D projection coords for demo
        { x: 0, y: 0, z: 0, element: 'N' }, { x: 30, y: -20, z: 0, element: 'C' },
        { x: 60, y: 0, z: 0, element: 'N' }, { x: 60, y: 30, z: 0, element: 'C' },
        { x: 30, y: 50, z: 0, element: 'C' }, { x: 0, y: 30, z: 0, element: 'C' },
        { x: -10, y: -30, z: 0, element: 'C' }, { x: 90, y: -20, z: 0, element: 'C' },
        { x: 60, y: 70, z: 0, element: 'O' }, { x: -30, y: 30, z: 0, element: 'O' },
    ],
    bonds: [
        { source: 0, target: 1, order: 1 }, { source: 1, target: 2, order: 1 },
        { source: 2, target: 3, order: 1 }, { source: 3, target: 4, order: 2 },
        { source: 4, target: 5, order: 1 }, { source: 5, target: 0, order: 1 },
        { source: 0, target: 6, order: 1 }, { source: 2, target: 7, order: 1 },
        { source: 3, target: 8, order: 2 }, { source: 5, target: 9, order: 2 },
    ]
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    formula: 'C9H8O4',
    description: 'Acetylsalicylic acid, used to reduce pain, fever, or inflammation.',
    atoms: [
        { x: 0, y: 0, z: 0, element: 'C' }, { x: 30, y: 0, z: 0, element: 'C' },
        { x: 45, y: 26, z: 0, element: 'C' }, { x: 30, y: 52, z: 0, element: 'C' },
        { x: 0, y: 52, z: 0, element: 'C' }, { x: -15, y: 26, z: 0, element: 'C' },
        { x: 75, y: 26, z: 0, element: 'O' }, { x: 95, y: 46, z: 0, element: 'C' },
        { x: 95, y: 76, z: 0, element: 'O' }, { x: 115, y: 26, z: 0, element: 'C' },
    ],
    bonds: [
        { source: 0, target: 1, order: 2 }, { source: 1, target: 2, order: 1 },
        { source: 2, target: 3, order: 2 }, { source: 3, target: 4, order: 1 },
        { source: 4, target: 5, order: 2 }, { source: 5, target: 0, order: 1 },
        { source: 2, target: 6, order: 1 }, { source: 6, target: 7, order: 1 },
        { source: 7, target: 8, order: 2 }, { source: 7, target: 9, order: 1 },
    ]
  }
];

// A subset of elements for the visualization
export const PERIODIC_DATA: PeriodicElement[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'non-metal', row: 1, col: 1, summary: 'Lightest element, essential for life and stars.' },
  { number: 2, symbol: 'He', name: 'Helium', mass: 4.0026, category: 'noble-gas', row: 1, col: 18, summary: 'Inert gas, used in balloons and cryogenics.' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, category: 'alkali-metal', row: 2, col: 1, summary: 'Lightest metal, used in batteries.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, category: 'alkaline-earth-metal', row: 2, col: 2, summary: 'Lightweight but strong metal, toxic.' },
  { number: 5, symbol: 'B', name: 'Boron', mass: 10.81, category: 'metalloid', row: 2, col: 13, summary: 'Essential for plant growth, used in glass.' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: 12.011, category: 'non-metal', row: 2, col: 14, summary: 'The basis of organic chemistry and life.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, category: 'non-metal', row: 2, col: 15, summary: 'Makes up 78% of Earths atmosphere.' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, category: 'non-metal', row: 2, col: 16, summary: 'Essential for respiration and combustion.' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, category: 'halogen', row: 2, col: 17, summary: 'Most electronegative element, highly reactive.' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: 20.180, category: 'noble-gas', row: 2, col: 18, summary: 'Used in advertising signs and lasers.' },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: 22.990, category: 'alkali-metal', row: 3, col: 1, summary: 'Soft metal, highly reactive with water.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, category: 'alkaline-earth-metal', row: 3, col: 2, summary: 'Burns with bright white light, strong alloys.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', mass: 26.982, category: 'post-transition-metal', row: 3, col: 13, summary: 'Lightweight, corrosion-resistant metal.' },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, category: 'metalloid', row: 3, col: 14, summary: 'Semiconductor, basis of modern electronics.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, category: 'non-metal', row: 3, col: 15, summary: 'Essential for DNA and energy transfer (ATP).' },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, category: 'non-metal', row: 3, col: 16, summary: 'Yellow solid, found in volcanic regions.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, category: 'halogen', row: 3, col: 17, summary: 'Used for water purification and disinfectants.' },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, category: 'noble-gas', row: 3, col: 18, summary: 'Inert gas used in welding and light bulbs.' },
  { number: 19, symbol: 'K', name: 'Potassium', mass: 39.098, category: 'alkali-metal', row: 4, col: 1, summary: 'Vital for nerve function, highly reactive.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, category: 'alkaline-earth-metal', row: 4, col: 2, summary: 'Essential for strong bones and teeth.' },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, category: 'transition-metal', row: 4, col: 8, summary: 'Most used metal, carries oxygen in blood.' },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, category: 'transition-metal', row: 4, col: 11, summary: 'Excellent conductor of electricity and heat.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, category: 'transition-metal', row: 4, col: 12, summary: 'Used to galvanize steel, essential for immunity.' },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, category: 'transition-metal', row: 5, col: 11, summary: 'Highest electrical conductivity of all metals.' },
  { number: 79, symbol: 'Au', name: 'Gold', mass: 196.97, category: 'transition-metal', row: 6, col: 11, summary: 'Malleable, corrosion-resistant, precious metal.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: 200.59, category: 'transition-metal', row: 6, col: 12, summary: 'Liquid metal at room temperature, toxic.' },
];

export const MIXER_CHEMICALS: MixerChemical[] = [
  { id: 'Na', name: 'Sodium', formula: 'Na', type: 'solid', color: 'bg-slate-400' },
  { id: 'Cl2', name: 'Chlorine Gas', formula: 'Cl₂', type: 'gas', color: 'bg-green-200' },
  { id: 'H2', name: 'Hydrogen', formula: 'H₂', type: 'gas', color: 'bg-blue-100' },
  { id: 'O2', name: 'Oxygen', formula: 'O₂', type: 'gas', color: 'bg-red-100' },
  { id: 'H2O', name: 'Water', formula: 'H₂O', type: 'liquid', color: 'bg-blue-400' },
  { id: 'HCl', name: 'Hydrochloric Acid', formula: 'HCl', type: 'liquid', color: 'bg-yellow-100' },
  { id: 'NaOH', name: 'Sodium Hydroxide', formula: 'NaOH', type: 'liquid', color: 'bg-white' },
  { id: 'C', name: 'Carbon', formula: 'C', type: 'solid', color: 'bg-black' },
  { id: 'Fe', name: 'Iron', formula: 'Fe', type: 'solid', color: 'bg-gray-600' },
  // Products not in shelf initially but used for replacement
  { id: 'NaCl', name: 'Sodium Chloride', formula: 'NaCl', type: 'solid', color: 'bg-white' },
  { id: 'CO2', name: 'Carbon Dioxide', formula: 'CO₂', type: 'gas', color: 'bg-gray-300' },
  { id: 'Fe2O3', name: 'Iron(III) Oxide', formula: 'Fe₂O₃', type: 'solid', color: 'bg-red-800' },
];

export const MIXER_RECIPES: MixerRecipe[] = [
  {
    reactants: ['Na', 'Cl2'],
    products: ['NaCl'],
    resultText: '2Na + Cl₂ → 2NaCl (Sodium Chloride)',
    type: 'combustion',
    conditions: { minTemp: 20 } // Room temp triggers it
  },
  {
    reactants: ['H2', 'O2'],
    products: ['H2O'],
    resultText: '2H₂ + O₂ → 2H₂O (Water)',
    type: 'combustion',
    conditions: { minTemp: 100 } // Needs activation energy (spark/heat)
  },
  {
    reactants: ['C', 'O2'],
    products: ['CO2'],
    resultText: 'C + O₂ → CO₂ (Carbon Dioxide)',
    type: 'combustion',
    conditions: { minTemp: 150 } // Needs heat to burn carbon
  },
  {
    reactants: ['HCl', 'NaOH'],
    products: ['NaCl', 'H2O'],
    resultText: 'HCl + NaOH → NaCl + H₂O (Neutralization)',
    type: 'neutralization',
    // No temp req, spontaneous
  },
  {
    reactants: ['Na', 'H2O'],
    products: ['NaOH', 'H2'],
    resultText: '2Na + 2H₂O → 2NaOH + H₂ (Vigorous!)',
    type: 'displacement',
    // Spontaneous
  },
  {
    reactants: ['Fe', 'O2'],
    products: ['Fe2O3'],
    resultText: '4Fe + 3O₂ → 2Fe₂O₃ (Rust)',
    type: 'combustion',
    conditions: { minTemp: 20 } // Slow at room temp, but we'll allow it
  }
];
