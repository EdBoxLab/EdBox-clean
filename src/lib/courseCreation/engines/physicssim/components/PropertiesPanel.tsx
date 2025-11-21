
import React from 'react';
import { 
  PhysicsConfig, 
  DoublePendulumConfig, 
  ProjectileConfig,
  KinematicsConfig,
  MomentumConfig,
  ForceConfig,
  PressureConfig, 
  LeverConfig, 
  ChaosConfig,
  ElectromagnetismConfig,
  OpticsConfig,
  WavesConfig,
  QuantumConfig,
  AtomicConfig,
  SimulationType 
} from '../types';
import { RefreshCw, PlayCircle, Info } from 'lucide-react';

interface PropertiesPanelProps {
  config: PhysicsConfig;
  onConfigChange: (newConfig: PhysicsConfig) => void;
  onReset: () => void;
  onSimulate: () => void;
  availableSimulations: { id: SimulationType, name: string }[];
  currentSimulation: SimulationType;
  onSimulationChange: (id: SimulationType) => void;
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  config, 
  onConfigChange, 
  onReset, 
  onSimulate,
  availableSimulations,
  currentSimulation,
  onSimulationChange,
  className = "" 
}) => {

  // Generic Slider
  const SliderControl = ({ 
    label, value, onChange, min, max, step, unit, colorClass = "accent-blue-500", bgClass = "bg-blue-500/20 text-blue-400"
  }: { 
    label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, unit: string, colorClass?: string, bgClass?: string 
  }) => (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex justify-between mb-4">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className={`text-xs font-mono py-1 px-2 rounded ${bgClass}`}>
          {value.toFixed(step < 0.01 ? 3 : (step < 0.1 ? 2 : 1))} {unit}
        </span>
      </div>
      <input 
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${colorClass}`}
      />
    </div>
  );

  // --- Renderers for specific configs ---

  const renderPendulum = (cfg: DoublePendulumConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Mass 1" value={cfg.m1} min={0.1} max={5} step={0.1} unit="kg" onChange={(v) => onConfigChange({...cfg, m1: v})} />
      <SliderControl label="Mass 2" value={cfg.m2} min={0.1} max={5} step={0.1} unit="kg" onChange={(v) => onConfigChange({...cfg, m2: v})} />
      <SliderControl label="Length 1" value={cfg.l1} min={0.5} max={3.0} step={0.1} unit="m" onChange={(v) => onConfigChange({...cfg, l1: v})} />
      <SliderControl label="Length 2" value={cfg.l2} min={0.5} max={3.0} step={0.1} unit="m" onChange={(v) => onConfigChange({...cfg, l2: v})} />
      <SliderControl label="Damping" value={cfg.damping} min={0} max={0.02} step={0.001} unit="" onChange={(v) => onConfigChange({...cfg, damping: v})} />
    </div>
  );

  const renderProjectile = (cfg: ProjectileConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Velocity" value={cfg.velocity} min={10} max={200} step={1} unit="m/s" onChange={(v) => onConfigChange({...cfg, velocity: v})} />
      <SliderControl label="Angle" value={cfg.angle} min={0} max={90} step={1} unit="deg" onChange={(v) => onConfigChange({...cfg, angle: v})} />
      <SliderControl label="Gravity" value={cfg.gravity} min={1} max={25} step={0.1} unit="m/s²" onChange={(v) => onConfigChange({...cfg, gravity: v})} />
      <SliderControl label="Height" value={cfg.height} min={0} max={100} step={1} unit="m" onChange={(v) => onConfigChange({...cfg, height: v})} />
      <SliderControl label="Bounciness" value={cfg.bounciness} min={0} max={0.95} step={0.05} unit="coef" onChange={(v) => onConfigChange({...cfg, bounciness: v})} />
    </div>
  );

  const renderKinematics = (cfg: KinematicsConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Initial Velocity" value={cfg.initialVelocity} min={0} max={50} step={1} unit="m/s" onChange={(v) => onConfigChange({...cfg, initialVelocity: v})} />
      <SliderControl label="Acceleration" value={cfg.acceleration} min={-20} max={20} step={0.5} unit="m/s²" onChange={(v) => onConfigChange({...cfg, acceleration: v})} />
      <SliderControl label="Total Time" value={cfg.totalTime} min={5} max={60} step={1} unit="s" onChange={(v) => onConfigChange({...cfg, totalTime: v})} />
    </div>
  );

  const renderMomentum = (cfg: MomentumConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Mass 1" value={cfg.mass1} min={1} max={50} step={1} unit="kg" onChange={(v) => onConfigChange({...cfg, mass1: v})} />
      <SliderControl label="Velocity 1" value={cfg.velocity1} min={-20} max={20} step={1} unit="m/s" onChange={(v) => onConfigChange({...cfg, velocity1: v})} />
      <SliderControl label="Mass 2" value={cfg.mass2} min={1} max={50} step={1} unit="kg" onChange={(v) => onConfigChange({...cfg, mass2: v})} />
      <SliderControl label="Velocity 2" value={cfg.velocity2} min={-20} max={20} step={1} unit="m/s" onChange={(v) => onConfigChange({...cfg, velocity2: v})} />
      <SliderControl label="Restitution (e)" value={cfg.restitution} min={0} max={1} step={0.1} unit="" onChange={(v) => onConfigChange({...cfg, restitution: v})} />
    </div>
  );

  const renderForce = (cfg: ForceConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Mass" value={cfg.mass} min={500} max={5000} step={100} unit="kg" onChange={(v) => onConfigChange({...cfg, mass: v})} />
      <SliderControl label="Applied Force" value={cfg.appliedForce} min={0} max={10000} step={100} unit="N" onChange={(v) => onConfigChange({...cfg, appliedForce: v})} />
      <SliderControl label="Friction Coeff" value={cfg.frictionCoeff} min={0} max={1} step={0.05} unit="" onChange={(v) => onConfigChange({...cfg, frictionCoeff: v})} />
    </div>
  );

  const renderPressure = (cfg: PressureConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Density" value={cfg.fluidDensity} min={500} max={2000} step={10} unit="kg/m³" onChange={(v) => onConfigChange({...cfg, fluidDensity: v})} />
      <SliderControl label="Depth" value={cfg.depth} min={0} max={10} step={0.1} unit="m" onChange={(v) => onConfigChange({...cfg, depth: v})} />
      <SliderControl label="Gravity" value={cfg.gravity} min={1.6} max={20} step={0.1} unit="m/s²" onChange={(v) => onConfigChange({...cfg, gravity: v})} />
    </div>
  );

  const renderLever = (cfg: LeverConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Load Mass" value={cfg.loadMass} min={1} max={100} step={1} unit="kg" onChange={(v) => onConfigChange({...cfg, loadMass: v})} />
      <SliderControl label="Load Dist" value={cfg.loadDist} min={0.5} max={5} step={0.1} unit="m" onChange={(v) => onConfigChange({...cfg, loadDist: v})} />
      <SliderControl label="Effort Force" value={cfg.effortForce} min={0} max={500} step={5} unit="N" onChange={(v) => onConfigChange({...cfg, effortForce: v})} />
      <SliderControl label="Effort Dist" value={cfg.effortDist} min={0.5} max={5} step={0.1} unit="m" onChange={(v) => onConfigChange({...cfg, effortDist: v})} />
    </div>
  );

  const renderChaos = (cfg: ChaosConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Sigma" value={cfg.sigma} min={1} max={50} step={0.1} unit="" onChange={(v) => onConfigChange({...cfg, sigma: v})} />
      <SliderControl label="Rho" value={cfg.rho} min={1} max={100} step={0.1} unit="" onChange={(v) => onConfigChange({...cfg, rho: v})} />
      <SliderControl label="Beta" value={cfg.beta} min={0.1} max={10} step={0.1} unit="" onChange={(v) => onConfigChange({...cfg, beta: v})} />
      <SliderControl label="Sim Speed" value={cfg.speed} min={0.1} max={5} step={0.1} unit="x" onChange={(v) => onConfigChange({...cfg, speed: v})} />
    </div>
  );

  const renderEM = (cfg: ElectromagnetismConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Charge 1 (Left)" value={cfg.charge1} min={-20} max={20} step={1} unit="µC" onChange={(v) => onConfigChange({...cfg, charge1: v})} />
      <SliderControl label="Charge 2 (Right)" value={cfg.charge2} min={-20} max={20} step={1} unit="µC" onChange={(v) => onConfigChange({...cfg, charge2: v})} />
      <div className="flex items-center justify-between bg-slate-900 p-5 rounded-xl border border-slate-800">
         <span className="text-sm font-medium text-slate-300">Show Field Lines</span>
         <input type="checkbox" checked={cfg.showVectors} onChange={(e) => onConfigChange({...cfg, showVectors: e.target.checked})} className="w-5 h-5 accent-blue-500" />
      </div>
    </div>
  );

  const renderOptics = (cfg: OpticsConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Focal Length" value={cfg.lensFocalLength} min={-100} max={100} step={1} unit="cm" onChange={(v) => onConfigChange({...cfg, lensFocalLength: v})} />
      <SliderControl label="Object Dist" value={cfg.objectDistance} min={10} max={200} step={1} unit="cm" onChange={(v) => onConfigChange({...cfg, objectDistance: v})} />
      <SliderControl label="Object Height" value={cfg.objectHeight} min={-50} max={50} step={1} unit="cm" onChange={(v) => onConfigChange({...cfg, objectHeight: v})} />
    </div>
  );

  const renderWaves = (cfg: WavesConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Freq 1" value={cfg.frequency1} min={0.1} max={10} step={0.1} unit="Hz" onChange={(v) => onConfigChange({...cfg, frequency1: v})} />
      <SliderControl label="Freq 2" value={cfg.frequency2} min={0.1} max={10} step={0.1} unit="Hz" onChange={(v) => onConfigChange({...cfg, frequency2: v})} />
      <SliderControl label="Phase Shift" value={cfg.phaseShift} min={0} max={6.28} step={0.1} unit="rad" onChange={(v) => onConfigChange({...cfg, phaseShift: v})} />
      <SliderControl label="Amplitude" value={cfg.amplitude} min={1} max={50} step={1} unit="" onChange={(v) => onConfigChange({...cfg, amplitude: v})} />
    </div>
  );

  const renderQuantum = (cfg: QuantumConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Packet Width" value={cfg.packetWidth} min={0.1} max={5} step={0.1} unit="nm" onChange={(v) => onConfigChange({...cfg, packetWidth: v})} />
      <SliderControl label="Momentum" value={cfg.momentum} min={0} max={20} step={0.1} unit="k" onChange={(v) => onConfigChange({...cfg, momentum: v})} />
    </div>
  );

  const renderAtomic = (cfg: AtomicConfig) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SliderControl label="Atomic Number (Z)" value={cfg.atomicNumber} min={1} max={20} step={1} unit="p+" onChange={(v) => onConfigChange({...cfg, atomicNumber: v})} />
    </div>
  );

  return (
    <div className={`bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden ${className}`}>
      {availableSimulations.length > 0 && (
        <div className="px-8 pt-8 pb-4 border-b border-slate-800/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Select Simulation</h3>
          <div className="flex flex-wrap gap-2">
            {availableSimulations.map((sim) => (
              <button
                key={sim.id}
                onClick={() => onSimulationChange(sim.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  currentSimulation === sim.id 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {sim.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 p-8 space-y-6 bg-slate-950/50 overflow-y-auto custom-scrollbar">
        {config.type === 'pendulum' && renderPendulum(config)}
        {config.type === 'projectile' && renderProjectile(config)}
        {config.type === 'kinematics' && renderKinematics(config)}
        {config.type === 'momentum' && renderMomentum(config)}
        {config.type === 'force' && renderForce(config)}
        {config.type === 'pressure' && renderPressure(config)}
        {config.type === 'lever' && renderLever(config)}
        {config.type === 'chaos' && renderChaos(config)}
        {config.type === 'electromagnetism' && renderEM(config)}
        {config.type === 'optics' && renderOptics(config)}
        {config.type === 'waves' && renderWaves(config)}
        {config.type === 'quantum' && renderQuantum(config)}
        {config.type === 'atomic' && renderAtomic(config)}
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex gap-4 items-center justify-between shrink-0">
        <button 
          onClick={onReset}
          className="px-6 py-4 text-slate-400 hover:text-white font-bold rounded-xl flex items-center transition-all hover:bg-slate-800 active:scale-95 text-sm tracking-wider"
        >
          <RefreshCw size={18} className="mr-2" />
          Reset Defaults
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={onSimulate}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl flex items-center justify-center transition-all hover:shadow-lg shadow-blue-900/20 active:scale-95 text-base tracking-wider min-w-[200px]"
          >
            <PlayCircle size={22} className="mr-3" />
            Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
