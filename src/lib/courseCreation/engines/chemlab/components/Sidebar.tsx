
import React from 'react';
import { Beaker, Scale, Atom, Settings, FlaskConical, Table2, Wind, TestTubes } from 'lucide-react';
import { ModuleType } from '../types';

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (m: ModuleType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange }) => {
  const modules = [
    { id: ModuleType.CHEMICAL_MIXER, icon: TestTubes, label: 'Reaction Mixer' },
    { id: ModuleType.STOICHIOMETRY, icon: Scale, label: 'Reactions' },
    { id: ModuleType.PERIODIC_TABLE, icon: Table2, label: 'Periodic Table' },
    { id: ModuleType.STATES_OF_MATTER, icon: Wind, label: 'States of Matter' },
    { id: ModuleType.TITRATION, icon: FlaskConical, label: 'Titration' },
    { id: ModuleType.MOLECULAR_VIEWER, icon: Atom, label: 'Molecules' },
  ];

  return (
    <div className="w-20 lg:w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <Beaker className="w-8 h-8 text-blue-500" />
        <span className="hidden lg:block ml-3 text-lg font-bold tracking-tight text-white">ChemLab</span>
      </div>

      <div className="flex-1 py-6 space-y-2 px-2 overflow-y-auto">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => onModuleChange(m.id)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
              activeModule === m.id
                ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <m.icon className={`w-6 h-6 ${activeModule === m.id ? 'text-blue-400' : 'group-hover:text-white'}`} />
            <span className="hidden lg:block ml-3 font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center p-3 text-slate-400 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
          <span className="hidden lg:block ml-3">Settings</span>
        </button>
      </div>
    </div>
  );
};
