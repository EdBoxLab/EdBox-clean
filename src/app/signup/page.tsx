'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Lock,
  Chrome,
  Sparkles,
  CheckCircle2,
  User,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  // State Management
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Technical Fix: Passing full_name to user_metadata
      // This ensures the OnboardingForm can pre-fill it and the DB won't crash
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        posthog.identify(data.user.id, { email, name: fullName });
        posthog.capture('user_signed_up', { method: 'email' });

        if (data.session) {
          // If session is present, email confirmation is disabled. Redirect immediately.
          router.push('/dashboard');
        } else {
          setMessage('Account created! Please check your email to confirm your account.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // Force origin to avoid cross-domain PKCE issues if NEXT_PUBLIC_APP_URL is mismatched
    const baseUrl = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex font-sans selection:bg-[#8B5CF6]/30 text-white">

      {/* Visual Side (Desktop) - Polished with Gradients */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0F0F10] items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
          >
            <div className="absolute -top-6 -left-6 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white p-4 rounded-2xl shadow-lg transform -rotate-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Master any subject in half the time.
            </h3>
            <p className="text-gray-400 leading-relaxed text-lg mb-8">
              "EdBox didn't just help me study; it changed how I learn. The generated study guides are incredibly accurate."
            </p>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1C1C1E] bg-zinc-800" />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex text-[#F59E0B] mb-0.5">
                  {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                </div>
                <span className="text-gray-500 font-medium">Joined by 10,000+ students</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#0A0A0A]">
        <div className="w-full max-w-[400px] space-y-8">

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left"
          >
            <Link href="/" className="inline-block mb-8">
              <span className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                EdBox
              </span>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Create your account
            </h2>
            <p className="text-gray-400 mt-2">
              The future of personalized education is here.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Button
              variant="outline"
              type="button"
              className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white font-medium transition-all rounded-xl"
              onClick={handleGoogleSignUp}
            >
              <Chrome className="mr-2 w-4 h-4" />
              Sign up with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0A] px-4 text-gray-500 tracking-widest">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-4">
                {/* FULL NAME FIELD - The critical addition */}
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 bg-[#161618] border-white/10 text-white pl-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-xl transition-all"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-[#161618] border-white/10 text-white pl-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-xl transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-[#161618] border-white/10 text-white pl-10 pr-10 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] rounded-xl transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 rotate-180" /> {error}
                  </motion.div>
                )}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {message}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold rounded-xl transition-all shadow-xl shadow-purple-900/20 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-gray-500"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors">
              Sign in
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
