'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { XPStreakDisplay } from './XPStreakDisplay';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { Crown } from 'lucide-react';
import { GenieIcon } from './GenieIcon';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/dashboard' },
  // { label: 'Courses', icon: BookOpen, href: '/courses' }, // Temporarily disabled
  // { label: 'Feed', icon: Sparkles, href: '/feed' },
  { label: 'Tools', icon: Wrench, href: '/tools' },
  // { label: 'Socials', icon: Users, href: '/socials' },
];

const SideMenu = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { tier, isPremium, status, currentPeriodEnd } = useSubscription();

  // Handle body scroll lock
  useEffect(() => {
    if (sidebarOpen) {
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [sidebarOpen]);

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header/Logo - Fixed */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-zinc-950 shrink-0" data-tour="step-1">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-primary/20">
              <Image
                src="/logo (1).ico"
                alt="EdBox"
                fill
                className="object-cover"
                priority
              />
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

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="flex flex-col min-h-full">
            {/* Live Streak & XP - Prominent at top of nav */}
            <div className="px-4 py-4">
              <XPStreakDisplay showCompact />
            </div>

            {/* Navigation Items */}
            <nav className="p-4 pt-0 space-y-1">
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    data-tour={`step-${index + 2}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30" : "text-gray-400 hover:bg-zinc-800/50 hover:text-white border border-transparent"}`}
                  >
                    <item.icon size={20} className={isActive ? "text-indigo-400" : "text-gray-400"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/pulse"
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === '/pulse' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-gray-400 hover:bg-zinc-800/50 hover:text-white border border-transparent"}`}
              >
                <div className={pathname === '/pulse' ? "text-cyan-400" : "text-gray-400"}>
                  <GenieIcon className="w-5 h-5 flex-shrink-0" />
                </div>
                <span>Ask Genie</span>
              </Link>
            </nav>

            {/* Spacer to push bottom sections down */}
            <div className="flex-grow" />

            {/* Bottom sections */}
            <div className="mt-auto">
              {/* Subscription Status Card */}
              <div className="px-4 py-4 border-t border-zinc-800 bg-zinc-900/30">
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isPremium ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {isPremium ? <Crown size={14} /> : <GenieIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        {tier === 'premium' ? 'Pro Plan' : 'Free Plan'}
                      </span>
                    </div>
                  </div>
                  {isPremium ? (
                    <button
                      onClick={() => {
                        router.push('/subscription');
                        setSidebarOpen(false);
                      }}
                      className="w-full mt-2 py-1.5 px-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-400 text-[10px] rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95"
                    >
                      <span className="font-semibold text-zinc-300 capitalize">{status || 'Active'}</span>
                      {currentPeriodEnd && (
                        <span className="opacity-80 mt-0.5">
                          Valid till {new Date(currentPeriodEnd).toLocaleDateString()}
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        router.push('/pricing');
                        setSidebarOpen(false);
                      }}
                      className="w-full mt-2 py-2 px-3 bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-bold rounded-lg transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                    >
                      <Crown size={12} />
                      UPGRADE TO PRO
                    </button>
                  )}
                </div>
              </div>

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
              <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <UserMenu />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <p className="text-xs text-gray-500 text-center">&copy; {new Date().getFullYear()} EdBox</p>
              </div>
            </div>
          </div>
        </div>
      </aside>


      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 sticky top-0 z-30">
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
          <span className="font-semibold text-white ml-2" data-tour="step-1-mobile">EdBox</span>
        </div>

        <div className="flex items-center gap-2">
          <div data-tour="step-user-mobile">
            <UserMenu isMobileHeader />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Icons Only */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 lg:hidden">
        <ul className="flex justify-around items-center py-2">
          {NAV_ITEMS.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  data-tour={`step-${index + 2}-mobile`}
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}

          <li key="genie-mobile">
            <Link
              href="/pulse"
              aria-label="Genie Workspace"
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${pathname === '/pulse' ? 'text-cyan-400' : 'text-gray-400 hover:text-white group'}`}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <GenieIcon className={`w-5 h-5 flex-shrink-0 ${pathname === '/pulse' ? 'fill-cyan-400' : ''}`} />
              </div>
              <span className="text-[10px] mt-1">Pulse</span>
            </Link>
          </li>
        </ul>
      </nav>

      {showSupport && (
        <ContactSupport onClose={() => setShowSupport(false)} />
      )}
    </>
  );
};

export default SideMenu;