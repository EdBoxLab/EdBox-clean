'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '../../lib/supabase/client';
import { useEffect, useState } from 'react';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setAvatarUrl(profile.avatar_url);
        setFullName(profile.full_name || user?.user_metadata?.full_name || user?.email || '');
      } else {
        setFullName(user?.user_metadata?.full_name || user?.email || '');
      }
    };

    fetchAvatar();
  }, [user]);

  const displayAvatar = avatarUrl || user?.user_metadata?.avatar_url;
  const isEmoji = displayAvatar && displayAvatar.length <= 2;

  return (
    <Avatar>
      {isEmoji ? (
        <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-zinc-800 to-zinc-700">
          {displayAvatar}
        </div>
      ) : (
        <AvatarImage src={displayAvatar || undefined} />
      )}
      <AvatarFallback>{getInitials(fullName || user?.email)}</AvatarFallback>
    </Avatar>
  );
}