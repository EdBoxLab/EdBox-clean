'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import Image component
import { useRouter } from 'next/navigation'; // Import useRouter
import { UserMenu } from './UserMenu';

export const Header = () => {
  const router = useRouter();

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => router.back()}
              className="mr-2 p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <Link href="/" className="flex items-center">
              <Image src="/Logo.jpg" style={{ borderRadius: '500px' }} alt="EdBox Logo" width={40} height={40} className="h-10 w-10 mr-2" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">EdBox</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex gap-4 lg:gap-8">
              <Link href="/about" className="text-sm lg:text-base font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white whitespace-nowrap">About</Link>
              <Link href="/contact" className="text-sm lg:text-base font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white whitespace-nowrap">Contact</Link>
            </nav>
            <div className="ml-2 sm:ml-4 md:ml-8">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
