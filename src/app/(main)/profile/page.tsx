'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { type User } from '@supabase/supabase-js';
import { Upload, User as UserIcon, Check, Brain, Zap, Flame, BookOpen, Trophy, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SkillRadarChart from '@/components/profile/SkillRadarChart';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import SkillDomainCard from '@/components/profile/SkillDomainCard';
import type { SkillGraphData } from '@/lib/services/skill-score-calculator';

const AVAILABLE_AVATARS = [
  '😀', '😎', '🤓', '🚀', '🎨', '🎯', '💡', '⚡', '🌟', '🔥',
  '🎮', '📚', '🎵', '🏆', '💻', '🧠', '🦄', '🐱', '🐶', '🦊',
  '🌈', '⭐', '🎪', '🎭', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺',
  '🎻', '🎲', '🎯', '🎳', '🎴', '🃏', '🀄', '🎰', '🧩', '🪀',
  '🪁', '🎈', '🎉', '🎊', '🎁', '🎀', '🪅', '🪆', '🧸', '🖼️',
  '🧵', '🪡', '🧶', '🪢', '👑', '👒', '🎩', '🎓', '⚽', '🏀'
];

export default function ProfilePage() {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();

  // Auth state
  const [user, setUser] = useState<User | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'emoji' | 'upload'>('emoji');

  // Skill graph data
  const [skillGraph, setSkillGraph] = useState<SkillGraphData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(true);

  // Load profile + skill graph data
  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      if (!currentUser) return;
      setUser(currentUser);
      setFullName(currentUser?.user_metadata?.full_name ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', currentUser.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url || '');
        setFullName(profile.full_name || currentUser?.user_metadata?.full_name || '');
        if (profile.avatar_url && profile.avatar_url.length <= 2) {
          setSelectedEmoji(profile.avatar_url);
        }
      }

      // Fetch skill graph + summary in parallel
      const [graphRes, summaryRes] = await Promise.all([
        fetch('/api/profile/skill-graph'),
        fetch('/api/profile/summary')
      ]);

      if (graphRes.ok) setSkillGraph(await graphRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      setGraphLoading(false);
    };

    fetchAll();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2MB', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const filePath = `avatars/${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      setSelectedEmoji('');
      toast({ title: 'Avatar uploaded!', description: 'Click Save Changes to apply' });
    }
    setLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setAvatarUrl(emoji);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const [{ error: profileError }, { error: authError }] = await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl, full_name: fullName }),
      supabase.auth.updateUser({ data: { full_name: fullName } })
    ]);
    setLoading(false);
    if (profileError || authError) {
      toast({ title: 'Update Error', description: profileError?.message || authError?.message, variant: 'destructive' });
    } else {
      posthog.capture('profile_updated', { has_avatar: !!avatarUrl });
      toast({ title: 'Profile Updated!', description: 'Your changes have been saved' });
    }
  };

  const copyShareLink = () => {
    if (!user) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${user.id}/public`);
    toast({ title: 'Link copied!', description: 'Share your Skill Graph with anyone' });
  };

  const currentAvatar = selectedEmoji || avatarUrl;
  const displayName = summary?.profile?.displayName || fullName || 'Learner';

  return (
    <div className="min-h-screen bg-[#09090b] p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {currentAvatar ? (
                currentAvatar.length <= 2
                  ? <span className="text-4xl">{currentAvatar}</span>
                  : <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              {summary?.profile?.goal && (
                <p className="text-blue-400 text-xs mt-1 font-medium">🎯 {summary.profile.goal}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 bg-transparent gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Share CV
            </Button>
          </div>
        </motion.div>

        {/* ── STATS ROW ── */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { label: 'XP', value: summary.xp.total.toLocaleString(), sub: `Level ${summary.xp.level}`, icon: Zap, color: 'text-amber-400' },
              { label: 'Streak', value: `${summary.streak.current}d`, sub: `Best: ${summary.streak.longest}d`, icon: Flame, color: 'text-orange-400' },
              { label: 'Topics Mastered', value: summary.learning.totalTopicsMastered, sub: `${summary.learning.activeSkills} active`, icon: BookOpen, color: 'text-blue-400' },
              { label: 'Evidence Points', value: summary.learning.evidencePoints.toLocaleString(), sub: 'Verified interactions', icon: Trophy, color: 'text-emerald-400' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-xs text-slate-500 font-medium">{label}</span>
                </div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── SKILL GRAPH AS CV ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Skill Graph</h2>
                  <p className="text-xs text-slate-500">
                    {skillGraph ? `${skillGraph.totalEvidencePoints} verified interactions · ${skillGraph.totalSkillsTracked} skills tracked` : 'Powered by your Pulse sessions'}
                  </p>
                </div>
              </div>
              {skillGraph && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{skillGraph.overallCVScore}<span className="text-slate-500 text-sm font-normal">%</span></div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">CV Score</div>
                </div>
              )}
            </div>

            {graphLoading ? (
              <div className="flex items-center justify-center h-48 gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Building your Skill Graph…
              </div>
            ) : skillGraph && skillGraph.domains.length > 0 ? (
              <div className="p-6 space-y-6">
                {/* Radar + Heatmap */}
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  {/* Radar */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Domain Map</h3>
                    <SkillRadarChart
                      labels={skillGraph.radarLabels}
                      values={skillGraph.radarValues}
                      size={280}
                    />
                  </div>

                  {/* Heatmap */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Learning Activity</h3>
                    <ActivityHeatmap data={skillGraph.activityTimeline} />
                    {skillGraph.strongestDomain && (
                      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                        <span className="text-xs text-slate-500">Strongest domain: </span>
                        <span className="text-xs font-semibold text-blue-400">{skillGraph.strongestDomain}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Domain Cards */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Skills by Domain</h3>
                  <div className="space-y-3">
                    {skillGraph.domains.map(domain => (
                      <SkillDomainCard
                        key={domain.graphId}
                        name={domain.name}
                        domainScore={domain.domainScore}
                        skills={domain.skills}
                      />
                    ))}
                  </div>
                </div>

                {/* Verified badge */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified by EdBox Genie · Interactively scored
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Share this profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <Brain className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-500">No skill data yet</p>
                <p className="text-xs text-slate-700 mt-1">Start a Skill Session in Pulse to build your graph</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── EDIT PROFILE ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">Avatar</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center overflow-hidden">
                      {currentAvatar ? (
                        currentAvatar.length <= 2
                          ? <span className="text-4xl">{currentAvatar}</span>
                          : <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{displayName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant={uploadMode === 'emoji' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('emoji')} className="flex-1">
                      Emoji
                    </Button>
                    <Button type="button" variant={uploadMode === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setUploadMode('upload')} className="flex-1">
                      Upload Image
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {uploadMode === 'emoji' ? (
                      <motion.div key="emoji" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700"
                      >
                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                          {AVAILABLE_AVATARS.map((emoji) => (
                            <motion.button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-slate-700/50 hover:bg-slate-600/60'}`}
                            >
                              {emoji}
                              {selectedEmoji === emoji && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-6 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors"
                      >
                        <label className="flex flex-col items-center cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-300 font-medium">Upload custom avatar</p>
                          <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
                          <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Full Name</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your name" className="bg-slate-800/50 border-slate-700 text-white" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <Input value={user?.email ?? ''} disabled className="bg-slate-800/30 border-slate-700 text-slate-400 cursor-not-allowed" />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200"
                >
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}