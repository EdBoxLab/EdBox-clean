'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Sparkles, Users } from 'lucide-react';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [betaFull, setBetaFull] = useState(false);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check beta status on mount
    fetch('/api/beta-status')
      .then(res => res.json())
      .then(data => {
        setBetaFull(data.isFull);
        setRemainingSpots(data.remainingSpots);
        setIsWaitlistMode(data.isFull);
      })
      .catch(console.error);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // Check beta status again before signup
      const betaResponse = await fetch('/api/beta-status');
      const betaData = await betaResponse.json();

      if (betaData.isFull) {
        // Redirect to waitlist
        setIsWaitlistMode(true);
        setLoading(false);
        return;
      }

      // Sign up user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Insert into profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id }]);

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        // Track beta signup
        const { error: betaError } = await supabase
          .from('beta_signups')
          .insert([{ user_id: data.user.id }]);

        if (betaError) {
          console.error('Beta tracking error:', betaError);
        }

        // Show success message
        setMessage(
          'Signup successful! Please check your email inbox and confirm your account before signing in.'
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Successfully added to waitlist! We\'ll notify you when we launch.');
        setEmail('');
      } else {
        setError(data.error || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Check beta status before OAuth
    const betaResponse = await fetch('/api/beta-status');
    const betaData = await betaResponse.json();

    if (betaData.isFull) {
      setIsWaitlistMode(true);
      setError('Beta is full. Please join the waitlist instead.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950">
      <Card className="w-[400px] bg-zinc-900/50 backdrop-blur-xl border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              EdBox
            </span>
          </div>
          <CardTitle className="text-white">
            {isWaitlistMode ? 'Join Waitlist' : 'Sign Up'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {isWaitlistMode 
              ? 'Beta access is full. Join our waitlist to get notified when we launch!' 
              : `Create your EdBox account. ${remainingSpots !== null ? `Only ${remainingSpots} beta spots left!` : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isWaitlistMode && remainingSpots !== null && remainingSpots > 0 && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">
                {remainingSpots} / 100 Beta Spots Available
              </span>
            </div>
          )}

          {isWaitlistMode && (
            <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-indigo-300">
                We'll email you as soon as we launch!
              </span>
            </div>
          )}

          <form onSubmit={isWaitlistMode ? handleWaitlistSubmit : handleSignUp}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              {!isWaitlistMode && (
                <div className="flex flex-col space-y-1.5">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {message && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 text-sm">{message}</p>
                </div>
              )}
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {loading ? 'Loading...' : (isWaitlistMode ? 'Join Waitlist' : 'Sign Up with Email')}
              </Button>
            </div>
          </form>

          {!isWaitlistMode && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700"
                onClick={handleGoogleSignUp}
              >
                Sign Up with Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!isWaitlistMode && (
            <p className="text-sm text-center w-full text-zinc-400">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-semibold text-indigo-400 hover:underline"
              >
                Sign In
              </a>
            </p>
          )}
          {isWaitlistMode && !betaFull && (
            <button
              onClick={() => setIsWaitlistMode(false)}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Back to Sign Up
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
