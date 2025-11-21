'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useToast } from '../../../components/ui/use-toast';

// Derive the User type from the Supabase client
type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setFullName(data.user?.user_metadata?.full_name ?? '');
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    setLoading(false);
    if (error) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile updated successfully',
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="email">Email</label>
                <Input id="email" type="email" value={user?.email ?? ''} disabled />
              </div>
              <div className="flex flex-col space-y-1.5">
                 <label htmlFor="fullName">Full Name</label>
                <Input id="fullName" type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
