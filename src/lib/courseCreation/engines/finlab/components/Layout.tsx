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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
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
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-hidden">
      {/* Unified Top Toolbar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-50 shrink-0">
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm whitespace-nowrap ${currentModule === item.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'
                }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2 ml-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-emerald-400 font-mono hidden sm:inline">LIVE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};