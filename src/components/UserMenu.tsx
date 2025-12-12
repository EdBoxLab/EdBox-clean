'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from './user-avatar';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

// Derive the User type from the Supabase client

type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Fetch initial user
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    fetchUser();


    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setUser(null);
    router.refresh();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  if (!user) {
    return <Button onClick={handleLogin}>Login</Button>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-left">
          <UserAvatar user={user} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">{user.email}</div>
            <div className="text-xs text-zinc-500 truncate">Free Plan</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-[#18181b] border-zinc-800">
        <DropdownMenuLabel className="text-zinc-200">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem onClick={() => router.push('/profile')} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}