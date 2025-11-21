import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  TrendingUp, 
  BookOpen, 
  Bot, 
  Menu,
  X
} from 'lucide-react';
import { ModuleType } from '../types';

interface LayoutProps {
  currentModule: ModuleType;
  onModuleChange: (mod: ModuleType) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: ModuleType.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { id: ModuleType.ACCOUNTING, label: 'Accounting', icon: BookOpen },
  { id: ModuleType.CORP_FINANCE, label: 'Corp Finance', icon: Calculator },
  { id: ModuleType.INVESTMENTS, label: 'Investments', icon: TrendingUp },
  { id: ModuleType.AI_TUTOR, label: 'AI Tutor', icon: Bot },
];

interface NavButtonProps {
  item: typeof navItems[0];
  isMobile?: boolean;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isMobile = false, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'
      } ${isMobile ? 'w-full' : 'w-full'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{item.label}</span>
    </button>
  );
};

export const Layout: React.FC<LayoutProps> = ({ currentModule, onModuleChange, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 p-4">
        <div className="flex items-center gap-2 px-4 mb-8 mt-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
            F
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
            FinLab
          </h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavButton 
              key={item.id} 
              item={item} 
              isActive={currentModule === item.id}
              onClick={() => onModuleChange(item.id)}
            />
          ))}
        </nav>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 mt-auto">
          <p className="text-xs text-slate-500 mb-1">Market Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-emerald-400 font-mono">LIVE</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-md flex items-center justify-center font-bold text-white text-sm">
            F
          </div>
          <span className="font-bold text-lg">FinLab</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-40 pt-20 px-4 animate-fade-in">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavButton 
                key={item.id} 
                item={item} 
                isMobile 
                isActive={currentModule === item.id}
                onClick={() => {
                  onModuleChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative md:p-0 pt-16">
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};