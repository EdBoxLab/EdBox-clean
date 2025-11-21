import { BioModule, TierType, TierData } from './types';

export const MODULES: Record<string, BioModule> = {
  // Student Edition Modules (High School Level)
  CellBiology: {
    id: 'CellBiology',
    name: 'Cell Biology',
    description: 'Introductory exploration of the cell: The basic unit of life. Covers plant vs animal cells, basic organelles, and mitosis.',
    imageUrl: 'https://picsum.photos/seed/hs_cell_bio/800/600',
    category: 'core',
    topics: ['Cell Structure', 'Mitosis', 'Basic Organelles']
  },
  Genetics: {
    id: 'Genetics',
    name: 'Genetics',
    description: 'Fundamentals of heredity. Learn about dominant and recessive traits, Punnett squares, and basic DNA structure.',
    imageUrl: 'https://picsum.photos/seed/hs_genetics/800/600',
    category: 'core',
    topics: ['Mendelian Genetics', 'Punnett Squares', 'Traits']
  },
  Ecology: {
    id: 'Ecology',
    name: 'Ecology',
    description: 'Study of the environment. Food chains, water cycles, and how organisms interact with their habitat.',
    imageUrl: 'https://picsum.photos/seed/hs_ecology/800/600',
    category: 'core',
    topics: ['Food Webs', 'Water Cycle', 'Habitats']
  },
  Evolution: {
    id: 'Evolution',
    name: 'Evolution',
    description: 'Introduction to Charles Darwin’s theory of Natural Selection and the history of life on Earth.',
    imageUrl: 'https://picsum.photos/seed/hs_evolution/800/600',
    category: 'core',
    topics: ['Natural Selection', 'Fossils', 'Adaptation']
  },
  PlantBiology: {
    id: 'PlantBiology',
    name: 'Plant Biology',
    description: 'Basics of botany. Photosynthesis, parts of a flower, and germination suited for secondary education.',
    imageUrl: 'https://picsum.photos/seed/hs_plants/800/600',
    category: 'core',
    topics: ['Photosynthesis', 'Flower Anatomy', 'Seeds']
  },
  PopulationBiology: {
    id: 'PopulationBiology',
    name: 'Population Biology',
    description: 'Understanding how populations grow and change over time using simple models.',
    imageUrl: 'https://picsum.photos/seed/hs_pop_bio/800/600',
    category: 'advanced',
    topics: ['Population Growth', 'Predator-Prey', 'Resources']
  },
  DevelopmentalBiologyIntro: {
    id: 'DevelopmentalBiologyIntro',
    name: 'Growth & Development',
    description: 'How organisms grow from a single cell to a complex being. Basic concepts of embryology.',
    imageUrl: 'https://picsum.photos/seed/hs_dev_bio/800/600',
    category: 'advanced',
    topics: ['Growth Cycles', 'Embryo Basics', 'Life Stages']
  },

  // Medical Edition Modules (Medical School / Clinical Level)
  Biochemistry: {
    id: 'Biochemistry',
    name: 'Biochemistry',
    description: 'Clinical enzymology and metabolic integration. Detailed analysis of Krebs cycle, oxidative phosphorylation, and enzyme kinetics.',
    imageUrl: 'https://picsum.photos/seed/med_biochem/800/600',
    category: 'clinical',
    topics: ['Enzymokinetics', 'Metabolic Pathways', 'Proteomics']
  },
  Physiology: {
    id: 'Physiology',
    name: 'Human Physiology',
    description: 'Advanced systemic physiology. In-depth study of cardiovascular hemodynamics, renal clearance, and respiratory mechanics.',
    imageUrl: 'https://picsum.photos/seed/med_physiology/800/600',
    category: 'clinical',
    topics: ['Hemodynamics', 'Renal Function', 'Gas Exchange']
  },
  Neuroscience: {
    id: 'Neuroscience',
    name: 'Clinical Neuroscience',
    description: 'Neuroanatomy and neurophysiology. Action potentials, neurotransmitter systems, and neuropathology.',
    imageUrl: 'https://picsum.photos/seed/med_neuro/800/600',
    category: 'clinical',
    topics: ['Neurotransmitters', 'Neural Circuits', 'Pathology']
  },
  Immunology: {
    id: 'Immunology',
    name: 'Immunology & Serology',
    description: 'Complex immune mechanisms. Major Histocompatibility Complex (MHC), T-cell maturation, and autoimmune pathophysiology.',
    imageUrl: 'https://picsum.photos/seed/med_immuno/800/600',
    category: 'clinical',
    topics: ['MHC Complex', 'Cytokines', 'Autoimmunity']
  },
  MolecularBiology: {
    id: 'MolecularBiology',
    name: 'Molecular Genetics',
    description: 'Advanced genetic mechanisms. DNA replication fidelity, CRISPR-Cas9 applications, and oncogenes.',
    imageUrl: 'https://picsum.photos/seed/med_molbio/800/600',
    category: 'clinical',
    topics: ['Gene Regulation', 'Oncology', 'Sequencing']
  },
  SystemsBiology: {
    id: 'SystemsBiology',
    name: 'Systems Biology',
    description: 'Computational modeling of complex biological networks and signal transduction pathways in disease states.',
    imageUrl: 'https://picsum.photos/seed/med_systems/800/600',
    category: 'advanced',
    topics: ['Network Topology', 'Signal Transduction', 'Computational Models']
  },
  Biomechanics: {
    id: 'Biomechanics',
    name: 'Orthopedic Biomechanics',
    description: 'Physics of musculoskeletal function. Stress-strain analysis of bone, ligament viscoelasticity, and prosthetic kinetics.',
    imageUrl: 'https://picsum.photos/seed/med_biomech/800/600',
    category: 'clinical',
    topics: ['Viscoelasticity', 'Kinematics', 'Prosthetics']
  },
  Bioinformatics: {
    id: 'Bioinformatics',
    name: 'Bioinformatics',
    description: 'Genomic data analysis. BLAST algorithms, protein structure prediction, and big data in personalized medicine.',
    imageUrl: 'https://picsum.photos/seed/med_bioinfo/800/600',
    category: 'advanced',
    topics: ['Genomics', 'Algorithms', 'Structural Biology']
  }
};

export const TIERS: Record<TierType, TierData> = {
  [TierType.STUDENT]: {
    id: TierType.STUDENT,
    name: 'Student Edition',
    modules: [
      'CellBiology', 
      'Genetics', 
      'Ecology', 
      'Evolution', 
      'PlantBiology', 
      'PopulationBiology', 
      'DevelopmentalBiologyIntro'
    ]
  },
  [TierType.MEDICAL]: {
    id: TierType.MEDICAL,
    name: 'Medical Edition',
    modules: [
      // Strictly Medical/Advanced Modules
      'Biochemistry', 
      'Physiology', 
      'Neuroscience', 
      'Immunology', 
      'MolecularBiology', 
      'SystemsBiology', 
      'Biomechanics', 
      'Bioinformatics'
    ]
  }
};