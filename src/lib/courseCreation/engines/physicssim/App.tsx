
import React, { useState, useEffect } from 'react';
import { Viewport } from './components/Viewport';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import {
  SimulationStatus,
  PhysicsConfig,
  SimulationType,
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
  AtomicConfig
} from './types';
import { Settings, Play, Activity, ArrowLeft, Zap, Wind, Sun, Waves, GitBranch, Hammer, Atom } from 'lucide-react';
import { Challenge } from '../../types';

// --- DEFAULTS ---
const DEFAULT_PENDULUM: DoublePendulumConfig = {
  type: 'pendulum', m1: 2.0, m2: 1.0, l1: 1.5, l2: 1.2, damping: 0.005, traceEnabled: true, traceLength: 300, initialTheta1: Math.PI / 2, initialTheta2: Math.PI / 2
};
const DEFAULT_PROJECTILE: ProjectileConfig = {
  type: 'projectile', velocity: 60, angle: 55, gravity: 9.81, height: 0, bounciness: 0.6
};
const DEFAULT_KINEMATICS: KinematicsConfig = {
  type: 'kinematics', initialVelocity: 0, acceleration: 5, totalTime: 20
};
const DEFAULT_MOMENTUM: MomentumConfig = {
  type: 'momentum', mass1: 10, velocity1: 10, mass2: 10, velocity2: -5, restitution: 1.0
};
const DEFAULT_FORCE: ForceConfig = {
  type: 'force', mass: 1000, appliedForce: 5000, frictionCoeff: 0.1
};
const DEFAULT_PRESSURE: PressureConfig = {
  type: 'pressure', fluidDensity: 1000, gravity: 9.81, depth: 2.0, containerWidth: 200, fluidColor: '#06b6d4'
};
const DEFAULT_LEVER: LeverConfig = {
  type: 'lever', loadMass: 10, loadDist: 2.0, effortForce: 100, effortDist: 2.0, fulcrumPos: 0.5, showTorque: true
};
const DEFAULT_CHAOS: ChaosConfig = {
  type: 'chaos', sigma: 10, rho: 28, beta: 2.66, speed: 1.0, tailLength: 1000
};
const DEFAULT_EM: ElectromagnetismConfig = {
  type: 'electromagnetism', charge1: 10, charge2: -10, showFieldLines: true, showVectors: true
};
const DEFAULT_OPTICS: OpticsConfig = {
  type: 'optics', lensFocalLength: 30, objectDistance: 60, objectHeight: 20, refractiveIndex: 1.5
};
const DEFAULT_WAVES: WavesConfig = {
  type: 'waves', frequency1: 1, frequency2: 1.5, amplitude: 10, phaseShift: 1.0, waveSpeed: 1
};
const DEFAULT_QUANTUM: QuantumConfig = {
  type: 'quantum', packetWidth: 1.0, momentum: 5.0, potentialHeight: 10, showRealImag: true
};
const DEFAULT_ATOMIC: AtomicConfig = {
  type: 'atomic', atomicNumber: 3, showElectronCloud: true
};

type ViewMode = 'setup' | 'result';

export const App: React.FC<{ challenge?: Challenge | null }> = ({ challenge }) => {
  const [activeModuleId, setActiveModuleId] = useState('mechanics');
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.PAUSED);
  const [simTime, setSimTime] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [resetKey, setResetKey] = useState(0);

  // Master Config State
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_PROJECTILE);

  // Sync Module -> Simulation Type defaults
  useEffect(() => {
    setViewMode('setup');
    setStatus(SimulationStatus.PAUSED);

    switch (activeModuleId) {
      case 'mechanics': setConfig(DEFAULT_PROJECTILE); break;
      case 'fluids': setConfig(DEFAULT_PRESSURE); break;
      case 'machines': setConfig(DEFAULT_LEVER); break;
      case 'chaos': setConfig(DEFAULT_CHAOS); break;
      case 'electromagnetism': setConfig(DEFAULT_EM); break;
      case 'optics': setConfig(DEFAULT_OPTICS); break;
      case 'waves': setConfig(DEFAULT_WAVES); break;
      case 'quantum': setConfig(DEFAULT_ATOMIC); break; // Default to atomic here per request logic or quantum
      default: setConfig(DEFAULT_PENDULUM);
    }
  }, [activeModuleId]);

  const getModuleInfo = (id: string) => {
    const map: Record<string, { name: string, subtitle: string, icon: React.ElementType }> = {
      'mechanics': { name: 'Mechanics', subtitle: 'Motion & Dynamics', icon: Atom },
      'fluids': { name: 'Fluid Dynamics', subtitle: 'Pressure & Flow', icon: Wind },
      'machines': { name: 'Machines', subtitle: 'Torque & Equilibrium', icon: Hammer },
      'electromagnetism': { name: 'Electromagnetism', subtitle: 'Maxwell Field Solver', icon: Zap },
      'optics': { name: 'Optics', subtitle: 'Ray Tracing Lab', icon: Sun },
      'waves': { name: 'Waves', subtitle: 'Harmonic Interference', icon: Waves },
      'quantum': { name: 'Quantum', subtitle: 'Schrödinger Wavefunction', icon: Activity },
      'chaos': { name: 'Chaos', subtitle: 'Nonlinear Dynamics', icon: GitBranch },
    };
    return map[id] || { name: 'Unknown', subtitle: 'Module', icon: Settings };
  };

  const moduleInfo = getModuleInfo(activeModuleId);

  // Available simulations list
  const getAvailableSimulations = () => {
    if (activeModuleId === 'mechanics') return [
      { id: 'projectile', name: 'Projectile Motion' },
      { id: 'pendulum', name: 'Double Pendulum' },
      { id: 'kinematics', name: 'Kinematics Graph' },
      { id: 'momentum', name: 'Momentum (Collision)' },
      { id: 'force', name: 'Force (F=ma)' }
    ];
    if (activeModuleId === 'fluids') return [{ id: 'pressure', name: 'Hydrostatic Pressure' }];
    if (activeModuleId === 'machines') return [{ id: 'lever', name: 'Lever Systems' }];
    if (activeModuleId === 'chaos') return [{ id: 'chaos', name: 'Lorenz Attractor' }];
    if (activeModuleId === 'electromagnetism') return [{ id: 'electromagnetism', name: 'Electric Fields' }];
    if (activeModuleId === 'optics') return [{ id: 'optics', name: 'Ray Optics' }];
    if (activeModuleId === 'waves') return [{ id: 'waves', name: 'Superposition' }];
    if (activeModuleId === 'quantum') return [
      { id: 'atomic', name: 'Atomic Model' },
      { id: 'quantum', name: 'Wave Packets' }
    ];
    return [];
  };

  const handleSimulationChange = (type: SimulationType) => {
    switch (type) {
      case 'pendulum': setConfig(DEFAULT_PENDULUM); break;
      case 'projectile': setConfig(DEFAULT_PROJECTILE); break;
      case 'kinematics': setConfig(DEFAULT_KINEMATICS); break;
      case 'momentum': setConfig(DEFAULT_MOMENTUM); break;
      case 'force': setConfig(DEFAULT_FORCE); break;
      case 'pressure': setConfig(DEFAULT_PRESSURE); break;
      case 'lever': setConfig(DEFAULT_LEVER); break;
      case 'chaos': setConfig(DEFAULT_CHAOS); break;
      case 'electromagnetism': setConfig(DEFAULT_EM); break;
      case 'optics': setConfig(DEFAULT_OPTICS); break;
      case 'waves': setConfig(DEFAULT_WAVES); break;
      case 'quantum': setConfig(DEFAULT_QUANTUM); break;
      case 'atomic': setConfig(DEFAULT_ATOMIC); break;
    }
  };

  const renderSetupContent = () => {
    const availableSims = getAvailableSimulations();
    const simsList = availableSims as { id: SimulationType, name: string }[];

    return (
      <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 ring-1 ring-blue-500/30">
            {React.createElement(moduleInfo.icon, { className: "w-8 h-8 text-blue-400" })}
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-2">{moduleInfo.name} Lab</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Configure parameters for {availableSims.find(s => s.id === config.type)?.name || 'this system'}.
          </p>
        </div>
        <PropertiesPanel
          config={config}
          onConfigChange={setConfig}
          onReset={() => { handleSimulationChange(config.type as SimulationType); setResetKey(p => p + 1); }}
          onSimulate={() => { setViewMode('result'); setStatus(SimulationStatus.RUNNING); }}
          availableSimulations={simsList}
          currentSimulation={config.type as SimulationType}
          onSimulationChange={handleSimulationChange}
          className="w-full shadow-2xl shadow-black/50"
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30 rounded-xl">
      <div className="flex-1 flex flex-col relative min-w-0 bg-slate-950">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20 gap-4 overflow-x-auto">
          <div className="flex items-center gap-4">
            {viewMode === 'result' && (
              <button onClick={() => { setStatus(SimulationStatus.PAUSED); setViewMode('setup'); }} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}

            {/* Module Selector as Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
              {['mechanics', 'fluids', 'machines', 'electromagnetism', 'optics', 'waves', 'quantum', 'chaos'].map(id => {
                const info = getModuleInfo(id);
                const Icon = info.icon;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveModuleId(id)}
                    className={`p-2 rounded hover:bg-slate-800 transition-colors ${activeModuleId === id ? 'text-blue-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
                    title={info.name}
                  >
                    <Icon size={18} />
                  </button>
                )
              })}
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Module <span className="mx-2 text-slate-700">/</span> {moduleInfo.name}
              </div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 truncate">
                {moduleInfo.subtitle}
              </h1>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button onClick={() => { setStatus(SimulationStatus.PAUSED); setViewMode('setup'); }} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${viewMode === 'setup' ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
              <Settings size={16} className="mr-2" /> Setup
            </button>
            <button onClick={() => setViewMode('result')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center ${viewMode === 'result' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <Play size={16} className="mr-2" /> Result
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-950">
          {viewMode === 'setup' ? (
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex items-start justify-center bg-gradient-to-b from-slate-950 to-[#050b1c]">
              {renderSetupContent()}
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col min-h-0 animate-in fade-in duration-500">
              <Viewport
                key={resetKey}
                status={status}
                config={config}
                speedMultiplier={speedMultiplier}
                onTick={setSimTime}
              />
              <Timeline
                status={status}
                onPlayPause={() => setStatus(s => s === SimulationStatus.RUNNING ? SimulationStatus.PAUSED : SimulationStatus.RUNNING)}
                onStop={() => { setStatus(SimulationStatus.PAUSED); setSimTime(0); setResetKey(k => k + 1); }}
                time={simTime}
                speedMultiplier={speedMultiplier}
                onSpeedChange={setSpeedMultiplier}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
