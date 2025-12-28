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
import { Share2, Copy, TrendingUp, MessageSquare, BookOpen, Award, Calendar, BarChart3, Settings2, Sparkles, Brain, Target, Plus, X, Check } from 'lucide-react';
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

  interface ChatAnalytics {
    totalMessages: number;
    messagesLast7Days: number;
    averageMessagesPerDay: number;
    mostActiveDay: string;
    totalCircles: number;
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
    const [chatAnalytics, setChatAnalytics] = useState<ChatAnalytics | null>(null);
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
        await fetchChatAnalytics(currentUser.id);
        await fetchPreferences(currentUser.id);

        // Real-time subscriptions
        const messagesSubscription = supabase
          .channel('messages-analytics')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `user_id=eq.${currentUser.id}`
          }, () => fetchChatAnalytics(currentUser.id))
          .subscribe();

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

          return () => {
            supabase.removeChannel(messagesSubscription);
            supabase.removeChannel(studyKitSubscription);
            supabase.removeChannel(learnerStateSubscription);
            supabase.removeChannel(skillProgressSubscription);
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
          // Initialize preferences if they don't exist
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
        // Get study kit content count
        const { data: studyKits } = await supabase
          .from('study_kit_content')
          .select('id')
          .eq('user_id', userId);

        // Get user skill progress (XP, mastery, etc.)
        const { data: skillProgress } = await supabase
          .from('user_skill_progress')
          .select('*')
          .eq('user_id', userId);

        // Get learner state (Global XP, streak, badges)
        const { data: learnerState } = await supabase
          .from('learner_states')
          .select('*')
          .eq('user_id', userId)
          .single();

        const totalXP = (skillProgress?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0) + (learnerState?.total_xp || 0);
        const skillsLearned = skillProgress?.filter(p => p.mastery_achieved).length || 0;
        const averageMasteryLevel = skillProgress?.length 
          ? skillProgress.reduce((sum, p) => sum + (Number(p.success_rate) * 100 || 0), 0) / skillProgress.length 
          : 0;

        setStudyAnalytics({
          totalKits: studyKits?.length || 0,
          studyKitsCreated: studyKits?.length || 0,
          totalXP,
          currentStreak: learnerState?.streak || 0,
          badges: learnerState?.badges || [],
          skillsLearned,
          averageMasteryLevel,
        });
      } catch (error) {
        console.error('Error fetching study analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    const fetchChatAnalytics = async (userId: string) => {
      try {
        // Get total messages for user
        const { data: allMessages, error: msgError } = await supabase
          .from('messages')
          .select('id, created_at, circle_id')
          .eq('user_id', userId);

        if (msgError) throw msgError;

        // Messages in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const messagesLast7Days = allMessages?.filter(
          m => new Date(m.created_at) > sevenDaysAgo
        ).length || 0;

        const averageMessagesPerDay = allMessages?.length ? allMessages.length / 30 : 0;

        // Unique circles
        const uniqueCircles = new Set(allMessages?.map(m => m.circle_id).filter(Boolean));

        // Most active day
        const dayCount: Record<string, number> = {};
        allMessages?.forEach(msg => {
          const day = new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long' });
          dayCount[day] = (dayCount[day] || 0) + 1;
        });
        const mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
          dayCount[a] > dayCount[b] ? a : b, 'N/A'
        );

        setChatAnalytics({
          totalMessages: allMessages?.length || 0,
          messagesLast7Days,
          averageMessagesPerDay,
          mostActiveDay,
          totalCircles: uniqueCircles.size,
        });
      } catch (error) {
        console.error('Error fetching chat analytics:', error);
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Settings</h1>
        <Button onClick={handleShare} className="gap-2">
          <Share2 className="w-4 h-4" />
          Share Profile
        </Button>
      </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-transparent p-0 mb-8">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2">Profile</TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2">Preferences</TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2">Saved Items</TabsTrigger>
            <TabsTrigger value="study" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2">Study Analytics</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border shadow-sm py-2">Chat Analytics</TabsTrigger>
          </TabsList>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="h-full border-2 border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <CardTitle>Interests</CardTitle>
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
                      <Button onClick={addInterest} size="icon">
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
                            className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium border border-primary/20"
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
                <Card className="h-full border-2 border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Brain className="w-5 h-5" />
                      </div>
                      <CardTitle>Learning Style</CardTitle>
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
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            preferences?.learning_style === style.id
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-transparent bg-secondary/50 hover:bg-secondary hover:border-primary/20'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${preferences?.learning_style === style.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border'}`}>
                            <style.icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold flex items-center gap-2">
                              {style.label}
                              {preferences?.learning_style === style.id && <Check className="w-4 h-4" />}
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
              <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    <CardTitle>Personalization</CardTitle>
                  </div>
                  <CardDescription>Help us tailor EdBox to your needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-primary/10">
                    <div className="space-y-1">
                      <div className="font-bold">Onboarding Status</div>
                      <p className="text-sm text-muted-foreground">Toggle your onboarding completion status</p>
                    </div>
                      <Button
                        variant={preferences?.onboarded ? "default" : "outline"}
                        onClick={() => {
                          updatePreferences({ onboarded: false });
                          window.dispatchEvent(new CustomEvent('restart-tour'));
                        }}
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
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
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

                <Button disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SAVED ITEMS TAB */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>My Saved Items</CardTitle>
              <CardDescription>
                View, search, preview & delete content
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Input
                placeholder="Search saved items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
              />

              {savedLoading ? (
                <p>Loading...</p>
              ) : paginatedItems.length === 0 ? (
                <p>No saved items found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <h2 className="font-bold">
                        {item.content?.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {item.content?.type}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setPreviewItem(item)}
                        >
                          Preview
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>

                  <span className="text-sm pt-1">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

          {/* STUDY ANALYTICS TAB */}
          <TabsContent value="study">
            {analyticsLoading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="inline-block"
                  >
                    <Sparkles className="w-8 h-8 text-primary opacity-50" />
                  </motion.div>
                  <p className="mt-2 text-muted-foreground">Loading study analytics...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BookOpen className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <BookOpen className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{studyAnalytics?.totalKits || 0}</CardTitle>
                      <CardDescription className="font-medium">Study Kits Created</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Calendar className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Calendar className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{studyAnalytics?.currentStreak || 0} days</CardTitle>
                      <CardDescription className="font-medium">Learning Streak</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Award className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Award className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{studyAnalytics?.totalXP.toLocaleString() || 0} XP</CardTitle>
                      <CardDescription className="font-medium">Total Experience</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <TrendingUp className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{(studyAnalytics?.averageMasteryLevel || 0).toFixed(1)}%</CardTitle>
                      <CardDescription className="font-medium">Average Mastery</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Brain className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Brain className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{studyAnalytics?.skillsLearned || 0}</CardTitle>
                      <CardDescription className="font-medium">Skills Unlocked</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Target className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{studyAnalytics?.badges.length || 0}</CardTitle>
                      <CardDescription className="font-medium">Badges Collected</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </div>
            )}
          </TabsContent>

          {/* CHAT ANALYTICS TAB */}
          <TabsContent value="chat">
            {analyticsLoading ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="inline-block"
                  >
                    <MessageSquare className="w-8 h-8 text-primary opacity-50" />
                  </motion.div>
                  <p className="mt-2 text-muted-foreground">Loading chat analytics...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <MessageSquare className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <MessageSquare className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{chatAnalytics?.totalMessages || 0}</CardTitle>
                      <CardDescription className="font-medium">Total Messages Sent</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Target className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{chatAnalytics?.totalCircles || 0}</CardTitle>
                      <CardDescription className="font-medium">Study Circles Joined</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <TrendingUp className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{chatAnalytics?.messagesLast7Days || 0}</CardTitle>
                      <CardDescription className="font-medium">Messages (7 Days)</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BarChart3 className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <BarChart3 className="w-8 h-8 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{(chatAnalytics?.averageMessagesPerDay || 0).toFixed(1)}</CardTitle>
                      <CardDescription className="font-medium">Avg Messages/Day</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Calendar className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Calendar className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-3xl font-bold">{chatAnalytics?.mostActiveDay || 'N/A'}</CardTitle>
                      <CardDescription className="font-medium">Most Active Day</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Card className="border-2 hover:border-primary/30 transition-all group overflow-hidden relative bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="w-24 h-24" />
                    </div>
                    <CardHeader>
                      <Sparkles className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-xl font-bold">Keep Chatting!</CardTitle>
                      <CardDescription className="font-medium">Engagement is key to learning</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </div>
            )}
          </TabsContent>

      </Tabs>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewItem?.content?.title}</DialogTitle>
            <DialogDescription>
              {previewItem?.content?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 text-sm max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(previewItem?.content, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* SHARE DIALOG */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Profile</DialogTitle>
            <DialogDescription>
              Share your EdBox profile with others
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={copyShareUrl} size="icon">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => shareToSocial('twitter')} variant="outline">
                Twitter
              </Button>
              <Button onClick={() => shareToSocial('facebook')} variant="outline">
                Facebook
              </Button>
              <Button onClick={() => shareToSocial('linkedin')} variant="outline">
                LinkedIn
              </Button>
              <Button onClick={() => shareToSocial('whatsapp')} variant="outline">
                WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}