'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Sparkles,
  Wrench,
  Users,
  Menu,
  X,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { ContactSupport } from './ContactSupport';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Courses', icon: BookOpen, href: '/courses' },
  { label: 'Feed', icon: Sparkles, href: '/feed' },
  { label: 'Tools', icon: Wrench, href: '/tools' },
  { label: 'Socials', icon: Users, href: '/socials' },
];

const SideMenu = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border 
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header/Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-purple-900/50">
              E
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent">
                EdBox
              </span>
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-transparent"}
                `}
              >
                <item.icon size={20} className={isActive ? "text-indigo-400" : "text-zinc-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Contact Support Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setShowSupport(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 transition-all duration-200"
          >
            <MessageCircle size={18} />
            <span>Contact Support</span>
          </button>
        </div>

        {/* Theme and User Menu */}
        <div className="p-4 border-t border-border mt-auto flex items-center gap-3 min-w-0 bg-card/50">
          <div className="shrink-0">
            <ThemeToggle />
          </div>
          <div className="flex-1 min-w-0">
            <UserMenu />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground text-center">&copy; {new Date().getFullYear()} EdBox</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-card border-b border-border flex items-center px-4 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <Menu size={24} />
          </button>
          {pathname !== '/' && (
            <button
              onClick={() => router.back()}
              className="text-indigo-400 hover:text-indigo-300 p-1 flex items-center justify-center bg-white/5 rounded-lg border border-white/10"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        <span className="font-semibold text-foreground ml-2">EdBox</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Bottom Navigation - Icons Only */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border lg:hidden">
        <ul className="flex justify-around items-center py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showSupport && (
        <ContactSupport onClose={() => setShowSupport(false)} />
      )}
    </>
  );
};

export default SideMenu;