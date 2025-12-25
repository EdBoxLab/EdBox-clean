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
          fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
          {/* Header/Logo */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-950" data-tour="step-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                E
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                EdBox
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {NAV_ITEMS.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  data-tour={`step-${index + 2}`}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "text-gray-400 hover:bg-zinc-800/50 hover:text-white border border-transparent"}
                  `}
                >
                  <item.icon size={20} className={isActive ? "text-indigo-400" : "text-gray-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>


        {/* Contact Support Button */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setShowSupport(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-zinc-800/50 hover:text-white border border-zinc-800 transition-all duration-200"
          >
            <MessageCircle size={18} />
            <span>Contact Support</span>
          </button>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-zinc-800 mt-auto bg-zinc-950">
          <UserMenu />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <p className="text-xs text-gray-500 text-center">&copy; {new Date().getFullYear()} EdBox</p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1"
          >
            <Menu size={24} />
          </button>
          {pathname !== '/' && (
            <button
              onClick={() => router.back()}
              className="text-indigo-400 hover:text-indigo-300 p-1 flex items-center justify-center bg-zinc-800/50 rounded-lg border border-zinc-800"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        <span className="font-semibold text-white ml-2">EdBox</span>
      </header>

      {/* Mobile Bottom Navigation - Icons Only */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 lg:hidden">
        <ul className="flex justify-around items-center py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
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
