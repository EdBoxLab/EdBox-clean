'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { type User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2, Copy, TrendingUp, BookOpen, Award, Calendar, BarChart3, Sparkles, Brain, Target, Plus, X, Check, ThumbsUp, HelpCircle, Lightbulb, Play, FileText, Zap, Bookmark, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyAnalytics {
  totalKits: number;
  studyKitsCreated: number;
  totalXP: number;
  currentStreak: number;
  skillsLearned: number;
  badges: any[];
  averageMasteryLevel: number;
}

interface UserPreference {
  id: string;
  interests: string[];
  learning_style: 'visual' | 'auditory' | 'theoretical' | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Saved Items State
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Analytics State
  const [studyAnalytics, setStudyAnalytics] = useState<StudyAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [prefLoading, setPrefLoading] = useState(true);
  const [newInterest, setNewInterest] = useState('');

  // Sharing State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Pagination
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<any>(null);

  // Fetch user + saved content + analytics + preferences
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) {
        setSavedLoading(false);
        setAnalyticsLoading(false);
        setPrefLoading(false);
        return;
      }

      setUser(currentUser);
      setFullName(currentUser?.user_metadata?.full_name ?? '');

      // Fetch saved items
      const { data: savedData, error } = await supabase
        .from('saved_feed_items')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setSavedItems(savedData || []);
        setFilteredItems(savedData || []);
      }
      setSavedLoading(false);

      // Initial fetch
      await fetchStudyAnalytics(currentUser.id);
      await fetchPreferences(currentUser.id);

      // Real-time subscriptions
      const studyKitSubscription = supabase
        .channel('study-kit-analytics')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'study_kit_content',
          filter: `user_id=eq.${currentUser.id}`
        }, () => fetchStudyAnalytics(currentUser.id))
        .subscribe();

      const learnerStateSubscription = supabase
        .channel('learner-analytics')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'learner_states',
          filter: `user_id=eq.${currentUser.id}`
        }, () => fetchStudyAnalytics(currentUser.id))
        .subscribe();

      const skillProgressSubscription = supabase
        .channel('skill-progress-analytics')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_skill_progress',
          filter: `user_id=eq.${currentUser.id}`
        }, () => fetchStudyAnalytics(currentUser.id))
        .subscribe();

      // Streak is stored in profiles.current_streak
      const profileSubscription = supabase
        .channel('profile-streak-analytics')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        }, () => fetchStudyAnalytics(currentUser.id))
        .subscribe();

      return () => {
        supabase.removeChannel(studyKitSubscription);
        supabase.removeChannel(learnerStateSubscription);
        supabase.removeChannel(skillProgressSubscription);
        supabase.removeChannel(profileSubscription);
      };
    };

    fetchData();
  }, [supabase]);

  const fetchPreferences = async (userId: string) => {
    try {
      setPrefLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        const initialPref = {
          id: userId,
          interests: [],
          learning_style: null,
          onboarded: false,
        };
        const { data: newData, error: createError } = await supabase
          .from('user_preferences')
          .upsert(initialPref)
          .select()
          .single();

        if (!createError) setPreferences(newData);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setPrefLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreference>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          id: user.id,
          ...preferences,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : { id: user.id, interests: [], learning_style: null, onboarded: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...updates });
      toast({ title: 'Preferences Updated' });
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    if (preferences?.interests.includes(newInterest.trim())) {
      setNewInterest('');
      return;
    }
    const interests = [...(preferences?.interests || []), newInterest.trim()];
    updatePreferences({ interests });
    setNewInterest('');
  };

  const removeInterest = (interest: string) => {
    const interests = (preferences?.interests || []).filter(i => i !== interest);
    updatePreferences({ interests });
  };

  const fetchStudyAnalytics = async (userId: string) => {
    try {
      // 1. Study kits count
      const { data: studyKits } = await supabase
        .from('study_kit_content')
        .select('id')
        .eq('user_id', userId);

      // 2. Skill progress rows (XP earned, mastery_achieved per skill)
      const { data: skillProgress } = await supabase
        .from('user_skill_progress')
        .select('xp_earned, mastery_achieved, success_rate')
        .eq('user_id', userId);

      // 3. ALL learner_state rows for this user (one per skill_graph - NOT .single())
      const { data: learnerStates } = await supabase
        .from('learner_states')
        .select('total_xp, badges, skill_mastery')
        .eq('user_id', userId);

      // 4. Streak lives in profiles.current_streak — the authoritative source
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', userId)
        .single();

      // Aggregate XP: sum across all skill_graph learner_states + skill_progress rows
      const learnerXP = (learnerStates || []).reduce((sum, ls) => sum + (ls.total_xp || 0), 0);
      const progressXP = (skillProgress || []).reduce((sum, p) => sum + (p.xp_earned || 0), 0);
      const totalXP = learnerXP + progressXP;

      // Skills mastered: check both sources and take the larger count
      const skillsFromProgress = (skillProgress || []).filter(p => p.mastery_achieved).length;
      const skillsFromLearnerStates = (learnerStates || []).reduce((count, ls) => {
        if (!ls.skill_mastery || typeof ls.skill_mastery !== 'object') return count;
        return count + Object.values(ls.skill_mastery as Record<string, any>)
          .filter((s: any) => s?.isMastered === true).length;
      }, 0);
      const skillsLearned = Math.max(skillsFromProgress, skillsFromLearnerStates);

      // Badges: merge across all learner_state rows
      const allBadges = (learnerStates || []).flatMap(ls => ls.badges || []);

      // Average mastery: use skill_mastery JSONB successRate (0-1 scale → %)
      const allSkillEntries = (learnerStates || []).flatMap(ls => {
        if (!ls.skill_mastery || typeof ls.skill_mastery !== 'object') return [];
        return Object.values(ls.skill_mastery as Record<string, any>) as any[];
      });
      let averageMasteryLevel = 0;
      if (allSkillEntries.length > 0) {
        averageMasteryLevel = allSkillEntries.reduce((sum, s) => sum + (Number(s?.successRate) * 100 || 0), 0) / allSkillEntries.length;
      } else if (skillProgress && skillProgress.length > 0) {
        averageMasteryLevel = skillProgress.reduce((sum, p) => sum + (Number(p.success_rate) * 100 || 0), 0) / skillProgress.length;
      }

      setStudyAnalytics({
        totalKits: studyKits?.length || 0,
        studyKitsCreated: studyKits?.length || 0,
        totalXP,
        currentStreak: profile?.current_streak ?? 0,
        badges: allBadges,
        skillsLearned,
        averageMasteryLevel,
      });
    } catch (error) {
      console.error('Error fetching study analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Search Logic
  useEffect(() => {
    const results = savedItems.filter((item) =>
      item.content?.title?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredItems(results);
    setPage(1);
  }, [search, savedItems]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Update Profile
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Update Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
      });
    }
  };

  // Delete Saved Item
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('saved_feed_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Delete Failed',
        variant: 'destructive',
      });
    } else {
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
      toast({ title: 'Item Removed' });
    }
  };

  // Share Profile
  const handleShare = () => {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
    const url = `${baseUrl}/profile/${user?.id}`;
    setShareUrl(url);
    setShareDialogOpen(true);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copied to clipboard!' });
  };

  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent(`Check out my EdBox profile!`);
    const url = encodeURIComponent(shareUrl);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };

    window.open(urls[platform], '_blank');
  };

  // Stat card data for study analytics
  const statCards = studyAnalytics ? [
    {
      label: 'Study Kits',
      value: studyAnalytics.totalKits,
      suffix: '',
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      delay: 0.05,
    },
    {
      label: 'Day Streak',
      value: studyAnalytics.currentStreak,
      suffix: '',
      icon: Calendar,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      delay: 0.1,
    },
    {
      label: 'Total XP',
      value: studyAnalytics.totalXP.toLocaleString(),
      suffix: '',
      icon: Zap,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      delay: 0.15,
    },
    {
      label: 'Skills Mastered',
      value: studyAnalytics.skillsLearned,
      suffix: '',
      icon: Brain,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      delay: 0.2,
    },
    {
      label: 'Badges',
      value: studyAnalytics.badges.length,
      suffix: '',
      icon: Award,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      delay: 0.25,
    },
  ] : [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleShare} className="gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-95">
          <Share2 className="w-4 h-4" />
          Share Profile
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0 mb-8">
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2 rounded-xl transition-all duration-200">Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2 rounded-xl transition-all duration-200">Preferences</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2 rounded-xl transition-all duration-200">Saved Items</TabsTrigger>
          <TabsTrigger value="study" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2 rounded-xl transition-all duration-200">Analytics</TabsTrigger>
        </TabsList>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="h-full border rounded-2xl hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <CardTitle className="font-semibold">Interests</CardTitle>
                  </div>
                  <CardDescription>What would you like to learn about?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add interest (e.g. AI, Physics)"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                    />
                    <Button onClick={addInterest} size="icon" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {preferences?.interests.map((interest) => (
                        <motion.div
                          key={interest}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                        >
                          {interest}
                          <button
                            onClick={() => removeInterest(interest)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {(!preferences?.interests || preferences.interests.length === 0) && (
                      <p className="text-sm text-muted-foreground italic">No interests added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="h-full border rounded-2xl hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Brain className="w-5 h-5" />
                    </div>
                    <CardTitle className="font-semibold">Learning Style</CardTitle>
                  </div>
                  <CardDescription>How do you prefer to consume content?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'visual', label: 'Visual', icon: Sparkles, desc: 'Learn through images, diagrams, and spatial understanding' },
                      { id: 'auditory', label: 'Auditory', icon: MessageSquare, desc: 'Learn through listening, discussion, and spoken word' },
                      { id: 'theoretical', label: 'Theoretical', icon: BookOpen, desc: 'Learn through reading, writing, and logic' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => updatePreferences({ learning_style: style.id as any })}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left active:scale-95 ${preferences?.learning_style === style.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-transparent bg-secondary/50 hover:bg-secondary hover:border-primary/20'
                          }`}
                      >
                        <div className={`p-2 rounded-xl ${preferences?.learning_style === style.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border'}`}>
                          <style.icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold flex items-center gap-2">
                            {style.label}
                            {preferences?.learning_style === style.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{style.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border rounded-2xl hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Target className="w-5 h-5" />
                  </div>
                  <CardTitle className="font-semibold">Personalization</CardTitle>
                </div>
                <CardDescription>Help us tailor EdBox to your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-secondary/40 rounded-xl border border-border/50">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">Onboarding Status</div>
                    <p className="text-xs text-muted-foreground">Toggle your onboarding completion status</p>
                  </div>
                  <Button
                    variant={preferences?.onboarded ? "default" : "outline"}
                    onClick={() => {
                      updatePreferences({ onboarded: false });
                      window.dispatchEvent(new CustomEvent('restart-tour'));
                    }}
                    className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                  >
                    {preferences?.onboarded ? 'Completed' : 'Restart Onboarding'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="max-w-lg rounded-2xl border hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-semibold">Your Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input value={user?.email ?? ''} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <Button disabled={loading} className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAVED ITEMS TAB */}
        <TabsContent value="saved">
          <Card className="rounded-2xl border">
            <CardHeader>
              <CardTitle className="font-semibold">My Saved Items</CardTitle>
              <CardDescription>View, search, preview &amp; delete content</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search saved items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />
              {savedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Sparkles className="w-6 h-6 text-primary opacity-50" />
                  </motion.div>
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No saved items found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedItems.map((item) => {
                    const type = item.content?.type?.toLowerCase();
                    const iconMap: Record<string, React.ReactNode> = {
                      'quiz': <HelpCircle className="w-4 h-4 text-purple-400" />,
                      'fact': <Lightbulb className="w-4 h-4 text-yellow-400" />,
                      'article': <FileText className="w-4 h-4 text-blue-400" />,
                      'poll': <BarChart3 className="w-4 h-4 text-green-400" />,
                      'meme': <Sparkles className="w-4 h-4 text-pink-400" />,
                      'lesson': <BookOpen className="w-4 h-4 text-indigo-400" />,
                      'debate': <MessageSquare className="w-4 h-4 text-orange-400" />,
                      'insight': <Brain className="w-4 h-4 text-cyan-400" />,
                      'media': <Play className="w-4 h-4 text-red-400" />,
                      'challenge': <Zap className="w-4 h-4 text-amber-400" />,
                    };
                    const typeIcon = iconMap[type] || <Bookmark className="w-4 h-4 text-zinc-400" />;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative border rounded-xl overflow-hidden bg-card hover:border-primary/30 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer"
                        onClick={() => setPreviewItem(item)}
                      >
                        {item.content?.imageUrl && (
                          <div className="relative h-32 bg-zinc-900">
                            <img
                              src={item.content.imageUrl}
                              alt={item.content.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-medium uppercase text-white/80 flex items-center gap-1">
                                  {typeIcon}
                                  {item.content?.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 space-y-2">
                          {!item.content?.imageUrl && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="p-1.5 bg-secondary rounded-lg">
                                {typeIcon}
                              </span>
                              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                {item.content?.type}
                              </span>
                            </div>
                          )}

                          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {item.content?.title}
                          </h3>

                          {item.content?.topic && (
                            <p className="text-xs text-purple-400 font-medium">
                              @{item.content.topic.toLowerCase().replace(/\s+/g, '')}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.content?.xp_reward > 0 && (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <Zap className="w-3 h-3" /> {item.content.xp_reward}
                                </span>
                              )}
                              {item.saved_at && (
                                <span>{new Date(item.saved_at).toLocaleDateString()}</span>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <span className="text-sm pt-1">Page {page} of {totalPages}</span>
                  <Button size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDY ANALYTICS TAB */}
        <TabsContent value="study">
          {analyticsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              >
                <Sparkles className="w-8 h-8 text-primary opacity-40" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading your analytics…</p>
            </div>
          ) : (
            <div className="space-y-8">

              {/* Header row */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Study Analytics</h2>
                  <p className="text-xs text-muted-foreground">Your learning journey at a glance</p>
                </div>
              </motion.div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stat.delay, duration: 0.4, ease: 'easeOut' }}
                  >
                    <Card className="group border rounded-2xl hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300 cursor-default overflow-hidden">
                      <CardContent className="p-5">
                        <div className={`inline-flex p-2.5 rounded-xl mb-3 ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Mastery Progress Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
              >
                <Card className="border rounded-2xl hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Average Mastery Level</div>
                          <div className="text-xs text-muted-foreground">Across all practiced skills</div>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-purple-500">
                        {(studyAnalytics?.averageMasteryLevel || 0).toFixed(1)}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(studyAnalytics?.averageMasteryLevel || 0, 100)}%` }}
                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Badges Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
              >
                <Card className="border rounded-2xl hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-orange-500/10 rounded-xl">
                        <Award className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Badges Collected</div>
                        <div className="text-xs text-muted-foreground">
                          {studyAnalytics?.badges.length === 0
                            ? 'Complete challenges to earn your first badge'
                            : `${studyAnalytics?.badges.length} badge${(studyAnalytics?.badges.length || 0) > 1 ? 's' : ''} earned`}
                        </div>
                      </div>
                    </div>

                    {studyAnalytics?.badges.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="p-4 bg-secondary/60 rounded-2xl mb-3">
                          <Award className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">No badges yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Keep learning to unlock achievements</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {studyAnalytics?.badges.map((badge: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm font-medium text-orange-500 hover:bg-orange-500/15 transition-colors"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{typeof badge === 'string' ? badge : badge.name || 'Badge'}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {(() => {
                const type = previewItem?.content?.type?.toLowerCase();
                const iconMap: Record<string, React.ReactNode> = {
                  'quiz': <HelpCircle className="w-5 h-5 text-purple-400" />,
                  'fact': <Lightbulb className="w-5 h-5 text-yellow-400" />,
                  'article': <FileText className="w-5 h-5 text-blue-400" />,
                  'poll': <BarChart3 className="w-5 h-5 text-green-400" />,
                  'meme': <Sparkles className="w-5 h-5 text-pink-400" />,
                  'lesson': <BookOpen className="w-5 h-5 text-indigo-400" />,
                  'debate': <MessageSquare className="w-5 h-5 text-orange-400" />,
                  'insight': <Brain className="w-5 h-5 text-cyan-400" />,
                  'media': <Play className="w-5 h-5 text-red-400" />,
                  'challenge': <Zap className="w-5 h-5 text-amber-400" />,
                };
                return iconMap[type] || <Bookmark className="w-5 h-5 text-zinc-400" />;
              })()}
              {previewItem?.content?.title || 'Saved Item'}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase">
                {previewItem?.content?.type || 'Content'}
              </span>
              <span className="text-xs text-muted-foreground">
                Saved {previewItem?.saved_at ? new Date(previewItem.saved_at).toLocaleDateString() : ''}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {previewItem?.content?.imageUrl && (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900">
                <img
                  src={previewItem.content.imageUrl}
                  alt={previewItem.content.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {previewItem?.content?.topic && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-400">@{previewItem.content.topic.toLowerCase().replace(/\s+/g, '')}</span>
              </div>
            )}

            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
              {previewItem?.content?.type?.toLowerCase() === 'quiz' && previewItem?.content?.question && (
                <div>
                  <p className="font-medium mb-2">{previewItem.content.question}</p>
                  {previewItem.content.options && (
                    <div className="space-y-2">
                      {previewItem.content.options.map((opt: string, i: number) => (
                        <div
                          key={i}
                          className={`px-3 py-2 rounded-lg text-sm ${i === previewItem.content.correctAnswer ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800/50 text-zinc-400'}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {previewItem.content.explanation && (
                    <p className="text-sm text-muted-foreground mt-3 italic">{previewItem.content.explanation}</p>
                  )}
                </div>
              )}

              {(previewItem?.content?.type?.toLowerCase() === 'fact' || previewItem?.content?.type?.toLowerCase() === 'insight') && (
                <div>
                  <p className="text-sm leading-relaxed">{previewItem.content.content || previewItem.content.description}</p>
                  {previewItem.content.source && (
                    <p className="text-xs text-muted-foreground mt-2">Source: {previewItem.content.source}</p>
                  )}
                </div>
              )}

              {(previewItem?.content?.type?.toLowerCase() === 'article' || previewItem?.content?.type?.toLowerCase() === 'lesson') && (
                <div>
                  {previewItem.content.description && (
                    <p className="text-sm text-muted-foreground mb-2">{previewItem.content.description}</p>
                  )}
                  {previewItem.content.content && (
                    <p className="text-sm leading-relaxed">{typeof previewItem.content.content === 'string' ? previewItem.content.content.slice(0, 500) + '...' : ''}</p>
                  )}
                  {previewItem.content.keyPoints && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-primary mb-1">Key Points:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {previewItem.content.keyPoints.slice(0, 3).map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {previewItem?.content?.type?.toLowerCase() === 'poll' && (
                <div>
                  <p className="font-medium mb-2">{previewItem.content.question || previewItem.content.title}</p>
                  {previewItem.content.options && (
                    <div className="space-y-2">
                      {previewItem.content.options.map((opt: any, i: number) => (
                        <div key={i} className="px-3 py-2 bg-zinc-800/50 rounded-lg text-sm flex justify-between">
                          <span>{typeof opt === 'string' ? opt : opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previewItem?.content?.type?.toLowerCase() === 'challenge' && (
                <div>
                  <p className="text-sm leading-relaxed">{previewItem.content.description || previewItem.content.content}</p>
                  {previewItem.content.difficulty && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${previewItem.content.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                      previewItem.content.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                      {previewItem.content.difficulty}
                    </span>
                  )}
                </div>
              )}

              {previewItem?.content?.type?.toLowerCase() === 'meme' && (
                <div className="text-center">
                  {previewItem.content.caption && (
                    <p className="text-lg font-bold">{previewItem.content.caption}</p>
                  )}
                  {previewItem.content.punchline && (
                    <p className="text-sm text-muted-foreground mt-2">{previewItem.content.punchline}</p>
                  )}
                </div>
              )}

              {previewItem?.content?.type?.toLowerCase() === 'debate' && (
                <div>
                  <p className="font-medium mb-2">{previewItem.content.topic || previewItem.content.title}</p>
                  {previewItem.content.positions && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {previewItem.content.positions.map((pos: any, i: number) => (
                        <div key={i} className="px-3 py-2 bg-zinc-800/50 rounded-lg text-sm">
                          <span className="font-semibold text-xs uppercase text-primary">{pos.side}</span>
                          <p className="text-muted-foreground text-xs mt-1">{pos.argument}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!['quiz', 'fact', 'insight', 'article', 'lesson', 'poll', 'challenge', 'meme', 'debate'].includes(previewItem?.content?.type?.toLowerCase() || '') && (
                <div>
                  {previewItem?.content?.description && (
                    <p className="text-sm leading-relaxed">{previewItem.content.description}</p>
                  )}
                  {previewItem?.content?.content && typeof previewItem.content.content === 'string' && (
                    <p className="text-sm leading-relaxed mt-2">{previewItem.content.content.slice(0, 300)}...</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                {previewItem?.content?.xp_reward > 0 && (
                  <span className="flex items-center gap-1 text-purple-400 font-medium">
                    <Zap className="w-3 h-3" /> +{previewItem.content.xp_reward} XP
                  </span>
                )}
                {previewItem?.content?.likes > 0 && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" /> {previewItem.content.likes}
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                onClick={() => {
                  handleDelete(previewItem.id);
                  setPreviewItem(null);
                }}
              >
                <X className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SHARE DIALOG */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-semibold">Share Your Profile</DialogTitle>
            <DialogDescription>Share your EdBox profile with others</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={copyShareUrl} size="icon" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => shareToSocial('twitter')} variant="outline" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">Twitter</Button>
              <Button onClick={() => shareToSocial('facebook')} variant="outline" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">Facebook</Button>
              <Button onClick={() => shareToSocial('linkedin')} variant="outline" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">LinkedIn</Button>
              <Button onClick={() => shareToSocial('whatsapp')} variant="outline" className="hover:-translate-y-0.5 active:scale-95 transition-all duration-200">WhatsApp</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}