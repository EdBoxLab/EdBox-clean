
import React from 'react';
import { 
  Atom, 
  Zap, 
  Waves, 
  Wind, 
  Activity, 
  GitBranch, 
  Settings,
  BookOpen,
  Layers,
  Sun,
  Hammer
} from 'lucide-react';
import { ModuleDefinition } from '../types';

interface SidebarProps {
  activeModuleId: string;
  onSelectModule: (id: string) => void;
  collapsed?: boolean;
}

const modules: ModuleDefinition[] = [
  { id: 'mechanics', name: 'Mechanics', icon: 'Atom', enabled: true, description: 'Motion, forces, energy' },
  { id: 'fluids', name: 'Fluid Dynamics', icon: 'Wind', enabled: true, description: 'Pressure, flow, viscosity' },
  { id: 'machines', name: 'Machines', icon: 'Hammer', enabled: true, description: 'Levers, pulleys, torque' }, 
  { id: 'electromagnetism', name: 'Electromagnetism', icon: 'Zap', enabled: true, description: 'Fields, charges, Maxwell' },
  { id: 'optics', name: 'Optics', icon: 'Sun', enabled: true, description: 'Ray tracing, lenses' },
  { id: 'waves', name: 'Waves', icon: 'Waves', enabled: true, description: 'Oscillators, sound' },
  { id: 'quantum', name: 'Quantum', icon: 'Activity', enabled: true, description: 'Wave functions' },
  { id: 'chaos', name: 'Chaos', icon: 'GitBranch', enabled: true, description: 'Non-linear systems' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModuleId, onSelectModule, collapsed = false }) => {
  const getIcon = (name: string) => {
    switch(name) {
      case 'Atom': return <Atom size={20} />;
      case 'Zap': return <Zap size={20} />;
      case 'Sun': return <Sun size={20} />;
      case 'Wind': return <Wind size={20} />;
      case 'Waves': return <Waves size={20} />;
      case 'Activity': return <Activity size={20} />;
      case 'GitBranch': return <GitBranch size={20} />;
      case 'Hammer': return <Hammer size={20} />;
      default: return <Layers size={20} />;
    }
  };

  return (
    <aside 
      className={`
        ${collapsed ? 'w-0 border-none opacity-0' : 'w-20 lg:w-64 border-r opacity-100'} 
        bg-slate-950 border-slate-800 flex flex-col h-full transition-all duration-500 ease-in-out z-30 shrink-0 overflow-hidden whitespace-nowrap
      `}
    >
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800/50 min-w-[80px] lg:min-w-[256px]">
        <div className="text-blue-500 mr-0 lg:mr-3 bg-blue-500/10 p-2 rounded-lg">
          <Atom size={24} />
        </div>
        <span className="text-slate-100 font-bold tracking-wider hidden lg:block text-lg">AETERNUM</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar min-w-[80px] lg:min-w-[256px]">
        <div className="px-6 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wider hidden lg:block">
          Physics Modules
        </div>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => mod.enabled && onSelectModule(mod.id)}
            disabled={!mod.enabled}
            className={`w-full flex items-center px-4 lg:px-6 py-3.5 transition-all relative group
              ${activeModuleId === mod.id 
                ? 'bg-slate-900/80 text-blue-400 border-r-2 border-blue-500' 
                : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
              ${!mod.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className={`transition-colors ${activeModuleId === mod.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {getIcon(mod.icon)}
            </span>
            <span className="ml-3 text-sm font-medium hidden lg:block">{mod.name}</span>
            
            {activeModuleId === mod.id && (
               <div className="absolute inset-0 bg-blue-500/5 pointer-events-none hidden lg:block"></div>
            )}

            {/* Hover Tooltip */}
            {!collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-slate-700">
                <div className="font-bold mb-0.5">{mod.name}</div>
                <div className="text-slate-400">{mod.description}</div>
                {/* Arrow */}
                <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-1 border-8 border-transparent border-r-slate-800"></div>
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950 min-w-[80px] lg:min-w-[256px]">
        <button className="flex items-center text-slate-400 hover:text-white transition-colors w-full p-3 hover:bg-slate-900 rounded-xl mb-1 group">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="ml-3 text-sm font-medium hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  );
};
