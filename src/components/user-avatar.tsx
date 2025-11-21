'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '../../lib/supabase/client';

// Derive the User type from the Supabase client
type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];

function getInitials(name: string | undefined) {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0][0].toUpperCase();
}

export function UserAvatar({ user }: { user: User | null }) {
  return (
    <Avatar>
      <AvatarImage src={user?.user_metadata?.avatar_url} />
      <AvatarFallback>{getInitials(user?.user_metadata?.full_name ?? user?.email)}</AvatarFallback>
    </Avatar>
  );
}
