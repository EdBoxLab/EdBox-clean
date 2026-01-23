'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, Chrome, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

    // Redirect if already logged in or session found
    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
        }
      };
      
      checkUser();

      // Listen for auth state changes (e.g., from other tabs or automatic re-auth)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/dashboard');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Error handling & PostHog tracking logic preserved
      let errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) errorMessage = 'Please confirm your email first.';
      if (error.message === 'Invalid login credentials') errorMessage = 'Invalid email or password.';

      posthog.capture('login_failed', { reason: error.message });
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (data.user) {
      posthog.identify(data.user.id, { email: data.user.email });
      posthog.capture('user_logged_in', { method: 'email' });
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    posthog.capture('user_logged_in', { method: 'google' });
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
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B5CF6]/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            <span className="text-xs font-medium text-gray-300">New Feature: Smart Feed</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-6 leading-tight"
          >
            Master any subject <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-indigo-500">
              10x faster.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-400 leading-relaxed"
          >
            "EdBox is the only reason I passed Organic Chemistry. The AI explanations just click differently."
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">JD</div>
            <div className="text-sm">
              <div className="font-semibold text-white">John Doe</div>
              <div className="text-gray-500">Stanford University</div>
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
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-2">Enter your credentials to access your workspace.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <Button
              variant="outline"
              type="button"
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white font-medium transition-all"
              onClick={handleGoogleLogin}
            >
              <Chrome className="mr-2 w-4 h-4" />
              Continue with Google
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0A] px-2 text-gray-500">Or using email</span>
              </div>
            </div>

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
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-[#161618] border-white/10 text-white pl-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-lg transition-all"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-900/20"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-gray-500 space-y-2"
          >
            <Link href="/forgot-password" className="block text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors">
              Forgot your password?
            </Link>
            <p>
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}