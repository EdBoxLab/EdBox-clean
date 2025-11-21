'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SideMenu = () => {
  const pathname = usePathname();

  // Mobile sidebar state is no longer used as primary nav;
  // we keep it hidden on mobile and visible from sm breakpoint upward.
  const [mounted, setMounted] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Optional: ref for managing focus (e.g., future enhancements)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Ensure client-only logic doesn't mismatch SSR/hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track small-screen breakpoint (Tailwind sm = 640px)
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsSmallScreen(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, [mounted]);

  // Your menu items with icons (unchanged from your earlier version)
  const menuItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7m7-7v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: '/courses',
      label: 'Courses',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: '/fyp',
      label: 'FYP',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/tools',
      label: 'Tools',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
        </svg>
      ),
    },
    {
      href: '/socials',
      label: 'Socials',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2v-2a4 4 0 014-4h12.713M17 20v-9.934C17 5.042 11.954 3 5 3H2m12.147 5.934c-.2.166-.403.326-.61.482L12 10.934m9.664 1.114l-4.764-3.97A4 4 0 0017 7.001h-2.5C11.5 7 9 10.5 9 14.5s2.5 7.5 5.5 7.5h2.5c1.38 0 2.7-.56 3.664-1.566z" />
        </svg>
      ),
    },
  ];

  // Sidebar is visible on sm and up. On mobile, we keep it off-screen.
  // ARIA: keep a clear landmark and label.
  const ariaHiddenSidebar = mounted ? isSmallScreen : false;

  return (
    <>
      {/* Desktop/tablet sidebar: persistent from sm breakpoint upward */}
      <aside
        id="mobile-sidebar"
        role="navigation"
        aria-label="Primary"
        className={`
          bg-slate-800 text-slate-50 h-full flex flex-col shadow-lg
          fixed inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-300 ease-in-out
          ${isSmallScreen ? '-translate-x-full' : 'translate-x-0'}
          sm:translate-x-0 sm:static
        `}
        aria-hidden={ariaHiddenSidebar}
      >
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold text-white hover:text-indigo-400 transition-colors duration-200"
          >
            EdBox
          </Link>
          {/* Close button not needed since sidebar isn't used on mobile */}
          <button
            ref={closeBtnRef}
            className="p-2 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto">
          <ul className="space-y-1 sm:space-y-2 px-2 sm:px-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 sm:p-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    {/* Icon always visible */}
                    <span className="w-5 h-5 sm:w-5 sm:h-5">{item.icon}</span>
                    {/* Text label visible only from sm and up */}
                    <span className="ml-3 hidden sm:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">&copy; {new Date().getFullYear()} EdBox</p>
        </div>
      </aside>

      {/* Mobile bottom navigation: fixed, icons-only, easy to reach */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur border-t border-slate-700 sm:hidden"
        role="navigation"
        aria-label="Mobile primary"
      >
        <ul className="flex justify-around items-center py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}            // accessible name for icons-only
                  className={`flex flex-col items-center justify-center px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {/* Icon sized for touch targets */}
                  <span className="w-6 h-6">{item.icon}</span>
                  {/* Optional: tiny visible label on mobile (uncomment if desired) */}
                  {/* <span className="text-[10px] mt-1">{item.label}</span> */}
                  {/* Or keep labels for screen readers only */}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Prevent content from sitting under the bottom bar on mobile */}
      <div className="pb-16 sm:pb-0" />
    </>
  );
};

export default SideMenu;
