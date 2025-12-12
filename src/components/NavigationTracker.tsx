'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface NavigationTrackerProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function NavigationTracker({ 
  children, 
  title, 
  showBackButton = true,
  onBack 
}: NavigationTrackerProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const navigationStack = JSON.parse(
      sessionStorage.getItem('navigationStack') || '[]'
    );
    
    if (!navigationStack.includes(pathname)) {
      navigationStack.push(pathname);
      sessionStorage.setItem('navigationStack', JSON.stringify(navigationStack));
    }
  }, [pathname]);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    const navigationStack = JSON.parse(
      sessionStorage.getItem('navigationStack') || '[]'
    );

    if (navigationStack.length > 1) {
      navigationStack.pop();
      const previousPath = navigationStack[navigationStack.length - 1];
      sessionStorage.setItem('navigationStack', JSON.stringify(navigationStack));
      router.push(previousPath);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {showBackButton && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </button>
          {title && (
            <>
              <div className="w-px h-6 bg-white/10" />
              <h1 className="text-lg font-semibold truncate">{title}</h1>
            </>
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function clearNavigationStack() {
  sessionStorage.removeItem('navigationStack');
}

export function getNavigationStack(): string[] {
  return JSON.parse(sessionStorage.getItem('navigationStack') || '[]');
}
