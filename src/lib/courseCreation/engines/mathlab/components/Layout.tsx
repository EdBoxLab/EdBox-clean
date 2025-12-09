import React from 'react';
import {
  Calculator,
  TrendingUp,
  Shapes,
  Settings,
  Menu,
  X,
  Atom,
  BarChart3
} from 'lucide-react';
import { ToolType } from '../types';
import { APP_NAME } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTool,
  onToolChange,
  isSidebarCollapsed,
  toggleSidebar
}) => {

  const navItems = [
    { id: ToolType.SOLVER, icon: Calculator, label: 'Solver' },
    { id: ToolType.GRAPH, icon: TrendingUp, label: 'Grapher' },
    { id: ToolType.GEOMETRY, icon: Shapes, label: 'Geometry' },
    { id: ToolType.STATISTICS, icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-studio-bg overflow-hidden rounded-xl">
      {/* Top Toolbar */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-studio-panel shrink-0">
        <div className="flex items-center gap-2">
          <Atom className="text-indigo-500" />
          <span className="font-bold text-xl tracking-tight text-white hidden sm:inline">{APP_NAME}</span>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mx-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onToolChange(item.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm whitespace-nowrap
                ${currentTool === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                  : 'text-studio-muted hover:bg-white/5 hover:text-white'}
              `}
              title={item.label}
            >
              <item.icon size={18} />
              <span className="hidden sm:inline font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => onToolChange(ToolType.SETTINGS)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm
            ${currentTool === ToolType.SETTINGS ? 'bg-white/10 text-white' : 'text-studio-muted hover:bg-white/5 hover:text-white'}
          `}
        >
          <Settings size={18} />
        </button>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-16 bg-studio-panel border-t border-white/5 flex items-center justify-around px-2 z-20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onToolChange(item.id)}
            className={`
                flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                ${currentTool === item.id ? 'text-indigo-400' : 'text-studio-muted'}
              `}
          >
            <item.icon size={24} strokeWidth={currentTool === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => onToolChange(ToolType.SETTINGS)}
          className={`
                flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                ${currentTool === ToolType.SETTINGS ? 'text-indigo-400' : 'text-studio-muted'}
              `}
        >
          <Settings size={24} strokeWidth={currentTool === ToolType.SETTINGS ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

    </div >
  );
};
