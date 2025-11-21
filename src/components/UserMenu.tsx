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
      <DropdownMenuTrigger>
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
