'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
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
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  Github,
  Chrome,
  AlertCircle,
  Users,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

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
        // Track signup failed event
        posthog.capture('signup_failed', {
          method: 'email',
          error_reason: error.message.includes('already registered') ? 'email_exists' : 'unknown',
          error_message: error.message,
        });
        setError(error.message);
        setLoading(false);
        return;
      }

        if (data.user) {
          // Identify the user in PostHog
          posthog.identify(data.user.id, {
            email: email,
          });

          // Track signup event
          posthog.capture('user_signed_up', {
            method: 'email',
            email: email,
          });

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
        // Track waitlist join event
        posthog.capture('waitlist_joined', {
          email: email,
        });

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

    // Track OAuth signup attempt
    posthog.capture('user_signed_up', {
      method: 'google',
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Card className="bg-zinc-900/50 backdrop-blur-xl border-zinc-800/50 shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EdBox
              </span>
            </div>
            <CardTitle className="text-2xl text-white font-bold">
              {isWaitlistMode ? 'Join the Waitlist' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {isWaitlistMode
                ? 'Join 1,000+ students waiting for next-gen learning'
                : 'Start your journey to smarter learning today'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {!isWaitlistMode && remainingSpots !== null && remainingSpots > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300 font-medium leading-none">
                    {remainingSpots} / 100 Beta Spots Remaining
                  </span>
                </motion.div>
              )}

              {isWaitlistMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-indigo-300 font-medium leading-none">
                    Phase 1 beta is full. We'll notify you for Phase 2!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={isWaitlistMode ? handleWaitlistSubmit : handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800/50 border-zinc-700 text-white pl-10 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {!isWaitlistMode && (
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-zinc-800/50 border-zinc-700 text-white pl-10 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-green-400 text-sm">{message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-6 shadow-lg shadow-indigo-500/20 group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isWaitlistMode ? 'Join Waitlist' : 'Get Started'}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </form>

            {!isWaitlistMode && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-500 font-medium">
                      Or join with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-zinc-800/30 border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all py-6"
                  onClick={handleGoogleSignUp}
                >
                  <Chrome className="mr-2 w-4 h-4" />
                  Sign Up with Google
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-zinc-800/50 pt-6">
            {!isWaitlistMode ? (
              <p className="text-sm text-center w-full text-zinc-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign In
                </Link>
              </p>
            ) : (
              !betaFull && (
                <button
                  onClick={() => setIsWaitlistMode(false)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 justify-center w-full"
                >
                  Interested in regular signup?
                  <span className="text-indigo-400 font-semibold">Go back</span>
                </button>
              )
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
