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
    <div className="flex h-screen w-screen bg-studio-bg overflow-hidden">
      
      {/* Desktop/Tablet Sidebar */}
      <aside 
        className={`
          hidden md:flex flex-col bg-studio-panel border-r border-white/5 transition-all duration-300
          ${isSidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <button 
            onClick={toggleSidebar} 
            className="text-studio-muted hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <Menu size={24} /> : <div className="flex items-center gap-2"><Atom className="text-indigo-500" /><span className="font-bold text-xl tracking-tight text-white">{APP_NAME}</span></div>}
          </button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onToolChange(item.id)}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                ${currentTool === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-studio-muted hover:bg-white/5 hover:text-white'}
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-white/5">
           <button
              onClick={() => onToolChange(ToolType.SETTINGS)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                ${currentTool === ToolType.SETTINGS ? 'bg-white/10 text-white' : 'text-studio-muted hover:bg-white/5 hover:text-white'}
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
            >
              <Settings size={20} />
              {!isSidebarCollapsed && <span className="font-medium">Settings</span>}
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-studio-panel border-b border-white/5 flex items-center px-4 justify-between z-20">
           <div className="flex items-center gap-2">
             <Atom className="text-indigo-500 w-6 h-6" />
             <span className="font-bold text-lg text-white">{APP_NAME}</span>
           </div>
           {/* Placeholder for mobile menu trigger if needed later */}
        </header>

        <div className="flex-1 overflow-hidden relative">
           {children}
        </div>

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
      </main>
    </div>
  );
};
