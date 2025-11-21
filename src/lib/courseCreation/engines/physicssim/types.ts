
// Physics & Simulation Types

export enum SimulationStatus {
  PAUSED = 'PAUSED',
  RUNNING = 'RUNNING',
}

export type SimulationType = 
  | 'pendulum' 
  | 'projectile' 
  | 'kinematics'
  | 'momentum'
  | 'force'
  | 'pressure' 
  | 'lever' 
  | 'chaos' 
  | 'electromagnetism' 
  | 'optics' 
  | 'waves' 
  | 'quantum' 
  | 'atomic'
  | 'placeholder';

export interface Vector2 {
  x: number;
  y: number;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

// --- Configurations ---

export interface DoublePendulumConfig {
  type: 'pendulum';
  m1: number;
  m2: number;
  l1: number;
  l2: number;
  damping: number;
  traceEnabled: boolean;
  traceLength: number;
  initialTheta1: number;
  initialTheta2: number;
}

export interface ProjectileConfig {
  type: 'projectile';
  velocity: number; // m/s
  angle: number;    // degrees
  gravity: number;  // m/s^2
  height: number;   // initial height (m)
  bounciness: number; // 0 to 1
}

export interface KinematicsConfig {
  type: 'kinematics';
  initialVelocity: number; // m/s
  acceleration: number;    // m/s^2
  totalTime: number;       // s (for graph scaling)
}

export interface MomentumConfig {
  type: 'momentum';
  mass1: number;     // kg
  velocity1: number; // m/s
  mass2: number;     // kg
  velocity2: number; // m/s
  restitution: number; // 0 (inelastic) to 1 (elastic)
}

export interface ForceConfig {
  type: 'force';
  mass: number;      // kg
  appliedForce: number; // N
  frictionCoeff: number; 
}

export interface PressureConfig {
  type: 'pressure';
  fluidDensity: number; // kg/m^3
  gravity: number;      // m/s^2
  depth: number;        // m (sensor depth)
  containerWidth: number;
  fluidColor: string;
}

export interface LeverConfig {
  type: 'lever';
  loadMass: number;    // kg
  loadDist: number;    // m (left side)
  effortForce: number; // N
  effortDist: number;  // m (right side)
  fulcrumPos: number;  // relative center offset
  showTorque: boolean;
}

export interface ChaosConfig {
  type: 'chaos';
  sigma: number;
  rho: number;
  beta: number;
  speed: number;
  tailLength: number;
}

export interface ElectromagnetismConfig {
  type: 'electromagnetism';
  charge1: number; // microCoulombs
  charge2: number;
  showFieldLines: boolean;
  showVectors: boolean;
}

export interface OpticsConfig {
  type: 'optics';
  lensFocalLength: number; // cm
  objectDistance: number; // cm
  objectHeight: number; // cm
  refractiveIndex: number;
}

export interface WavesConfig {
  type: 'waves';
  frequency1: number;
  frequency2: number;
  amplitude: number;
  phaseShift: number;
  waveSpeed: number;
}

export interface QuantumConfig {
  type: 'quantum';
  packetWidth: number;
  momentum: number;
  potentialHeight: number;
  showRealImag: boolean;
}

export interface AtomicConfig {
  type: 'atomic';
  atomicNumber: number; // Protons
  showElectronCloud: boolean;
}

export type PhysicsConfig = 
  | DoublePendulumConfig 
  | ProjectileConfig 
  | KinematicsConfig
  | MomentumConfig
  | ForceConfig
  | PressureConfig 
  | LeverConfig
  | ChaosConfig
  | ElectromagnetismConfig
  | OpticsConfig
  | WavesConfig
  | QuantumConfig
  | AtomicConfig;
