'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email: data.user.email }]);
      if (profileError) {
        setError(profileError.message);
      } else {
        // Potentially show a "check your email" message
        router.push('/');
        router.refresh();
      }
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your EdBox account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Input id="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit">Sign Up with Email</Button>
            </div>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
            Sign Up with Google
          </Button>
        </CardContent>
         <CardFooter>
          <p className="text-sm text-center w-full">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
