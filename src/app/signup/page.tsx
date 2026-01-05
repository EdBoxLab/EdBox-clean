'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, Chrome, Sparkles, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [betaFull, setBetaFull] = useState(false);
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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
    setLoading(true);

    try {
      const betaCheck = await fetch('/api/beta-status').then(res => res.json());
      if (betaCheck.isFull) {
        setIsWaitlistMode(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.user) {
        posthog.identify(data.user.id, { email });
        posthog.capture('user_signed_up', { method: 'email' });
        setMessage('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        posthog.capture('waitlist_joined', { email });
        setMessage("You're on the list! We'll be in touch.");
        setEmail('');
      } else {
        setError(data.error);
      }
    } catch (err) { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleGoogleSignUp = async () => {
    const betaCheck = await fetch('/api/beta-status').then(res => res.json());
    if (betaCheck.isFull) {
      setIsWaitlistMode(true);
      setError('Beta is full. Please join the waitlist.');
      return;
    }
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex font-sans selection:bg-[#8B5CF6]/30 text-white">
      {/* Visual Side (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0F0F10] items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]"></div>
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-[#1C1C1E] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="absolute -top-6 -left-6 bg-[#8B5CF6] text-white p-4 rounded-xl shadow-lg transform -rotate-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">"It feels like cheating."</h3>
            <p className="text-gray-400 leading-relaxed text-lg mb-6">
              "I generated a full study guide for my Finals in 30 seconds. This used to take me all weekend. Seriously, thank you."
            </p>
            <div className="flex items-center gap-2 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map(i => <div key={i}>★</div>)}
              <span className="text-gray-500 text-sm ml-2 font-medium">Verified Student</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left"
          >
            <Link href="/" className="inline-block mb-6 lg:hidden">
              <span className="text-2xl font-bold tracking-tight">EdBox</span>
            </Link>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isWaitlistMode ? 'Join the Waitlist' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              {isWaitlistMode
                ? 'Join 1,000+ students waiting for next-gen learning.'
                : 'Start your journey to smarter learning today.'}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={isWaitlistMode ? handleWaitlistSubmit : handleSignUp}
            className="space-y-4"
          >
            {/* Beta / Waitlist Status */}
            <AnimatePresence mode="wait">
              {!isWaitlistMode && remainingSpots !== null && remainingSpots > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg flex items-center gap-3 overflow-hidden"
                >
                  <Users className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-medium text-[#F59E0B]">
                    {remainingSpots} / 100 Beta Spots Remaining
                  </span>
                </motion.div>
              )}
              {isWaitlistMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-300">
                    Phase 1 is full. Join waitlist for Phase 2!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isWaitlistMode && (
              <Button
                variant="outline"
                type="button"
                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white font-medium transition-all"
                onClick={handleGoogleSignUp}
              >
                <Chrome className="mr-2 w-4 h-4" />
                Sign up with Google
              </Button>
            )}

            {!isWaitlistMode && (
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0A0A0A] px-2 text-gray-500">Or using email</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-[#161618] border-white/10 text-white pl-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-lg transition-all"
                  />
                </div>
              </div>
              {!isWaitlistMode && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <Input
                      type="password"
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-[#161618] border-white/10 text-white pl-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-lg transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-900/20"
            >
              {loading ? 'Processing...' : (isWaitlistMode ? 'Join Waitlist' : 'Create Account')}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-gray-500"
          >
            {isWaitlistMode ? (
              <button onClick={() => setIsWaitlistMode(false)} className="text-[#8B5CF6] hover:text-[#A78BFA] transition-colors">
                Back to regular signup
              </button>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
