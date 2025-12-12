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
import { Share2, Copy, TrendingUp, MessageSquare, BookOpen, Award, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudyAnalytics {
  totalStudySets: number;
  totalStudyTime: number;
  studySetsCreated: number;
  averageMasteryLevel: number;
  totalXP: number;
  currentStreak: number;
  skillsLearned: number;
  badges: any[];
}

interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  messagesLast7Days: number;
  averageMessagesPerDay: number;
  mostActiveDay: string;
  totalChatTime: number;
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

  // Sharing State
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Pagination
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<any>(null);

  // Fetch user + saved content + analytics
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) {
        setSavedLoading(false);
        setAnalyticsLoading(false);
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

      // Fetch study analytics
      await fetchStudyAnalytics(currentUser.id);
      await fetchChatAnalytics(currentUser.id);
    };

    fetchData();
  }, [supabase]);

  const fetchStudyAnalytics = async (userId: string) => {
    try {
      // Get study sets count
      const { data: studySets, error: studySetsError } = await supabase
        .from('study_sets')
        .select('id, created_at')
        .eq('user_id', userId);

      // Get learner state (XP, streak, badges)
      const { data: learnerState, error: learnerError } = await supabase
        .from('learner_states')
        .select('total_xp, streak, badges, skill_mastery, level')
        .eq('user_id', userId)
        .single();

      // Get user progress (mastery levels)
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('mastery_level, skill_id')
        .eq('user_id', userId);

      const totalStudySets = studySets?.length || 0;
      const studySetsCreated = studySets?.length || 0;
      const totalXP = learnerState?.total_xp || 0;
      const currentStreak = learnerState?.streak || 0;
      const badges = learnerState?.badges || [];
      const skillsLearned = progress?.length || 0;
      
      const averageMasteryLevel = progress?.length 
        ? progress.reduce((sum, p) => sum + (p.mastery_level || 0), 0) / progress.length 
        : 0;

      // Estimate total study time (rough calculation based on XP)
      const totalStudyTime = Math.floor(totalXP / 10); // 10 XP = 1 minute (example)

      setStudyAnalytics({
        totalStudySets,
        totalStudyTime,
        studySetsCreated,
        averageMasteryLevel,
        totalXP,
        currentStreak,
        skillsLearned,
        badges,
      });
    } catch (error) {
      console.error('Error fetching study analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchChatAnalytics = async (userId: string) => {
    try {
      // Get total conversations
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('id, created_at')
        .eq('user_id', userId);

      // Get total messages
      const { data: allMessages, error: msgError } = await supabase
        .from('chat_messages')
        .select('id, conversation_id, created_at')
        .in('conversation_id', conversations?.map(c => c.id) || []);

      // Messages in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const messagesLast7Days = allMessages?.filter(
        m => new Date(m.created_at) > sevenDaysAgo
      ).length || 0;

      const averageMessagesPerDay = allMessages?.length ? allMessages.length / 30 : 0;

      // Calculate most active day (example)
      const dayCount: Record<string, number> = {};
      allMessages?.forEach(msg => {
        const day = new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      const mostActiveDay = Object.keys(dayCount).reduce((a, b) => 
        dayCount[a] > dayCount[b] ? a : b, 'N/A'
      );

      // Estimate total chat time (rough: 1 message = 2 minutes)
      const totalChatTime = (allMessages?.length || 0) * 2;

      setChatAnalytics({
        totalConversations: conversations?.length || 0,
        totalMessages: allMessages?.length || 0,
        messagesLast7Days,
        averageMessagesPerDay,
        mostActiveDay,
        totalChatTime,
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
    const url = `${window.location.origin}/profile/${user?.id}`;
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
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="saved">Saved Items</TabsTrigger>
          <TabsTrigger value="study">Study Analytics</TabsTrigger>
          <TabsTrigger value="chat">Chat Analytics</TabsTrigger>
        </TabsList>

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
              <CardContent className="pt-6">
                <p>Loading study analytics...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <BookOpen className="w-8 h-8 text-blue-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.totalStudySets || 0}</CardTitle>
                    <CardDescription>Total Study Sets</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <Calendar className="w-8 h-8 text-green-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.currentStreak || 0} days</CardTitle>
                    <CardDescription>Current Streak</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <Award className="w-8 h-8 text-yellow-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.totalXP || 0} XP</CardTitle>
                    <CardDescription>Total Experience</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.averageMasteryLevel.toFixed(1) || 0}%</CardTitle>
                    <CardDescription>Avg Mastery Level</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <BarChart3 className="w-8 h-8 text-red-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.skillsLearned || 0}</CardTitle>
                    <CardDescription>Skills Learned</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <Award className="w-8 h-8 text-orange-500 mb-2" />
                    <CardTitle className="text-2xl">{studyAnalytics?.badges.length || 0}</CardTitle>
                    <CardDescription>Badges Earned</CardDescription>
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
              <CardContent className="pt-6">
                <p>Loading chat analytics...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <MessageSquare className="w-8 h-8 text-blue-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.totalConversations || 0}</CardTitle>
                    <CardDescription>Total Conversations</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <MessageSquare className="w-8 h-8 text-green-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.totalMessages || 0}</CardTitle>
                    <CardDescription>Total Messages</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.messagesLast7Days || 0}</CardTitle>
                    <CardDescription>Messages (Last 7 Days)</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <BarChart3 className="w-8 h-8 text-orange-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.averageMessagesPerDay.toFixed(1) || 0}</CardTitle>
                    <CardDescription>Avg Messages/Day</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <Calendar className="w-8 h-8 text-red-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.mostActiveDay || 'N/A'}</CardTitle>
                    <CardDescription>Most Active Day</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <Award className="w-8 h-8 text-yellow-500 mb-2" />
                    <CardTitle className="text-2xl">{chatAnalytics?.totalChatTime || 0} min</CardTitle>
                    <CardDescription>Est. Total Chat Time</CardDescription>
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