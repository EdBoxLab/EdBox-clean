'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { type User } from '@supabase/supabase-js';
import { Upload, User as UserIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreakCard } from '@/components/StreakXP';

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

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'emoji' | 'upload'>('emoji');

  useEffect(() => {
    const fetchProfile = async () => {
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
    };

    fetchProfile();
  }, [supabase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    
    if (file.size > MAX_SIZE) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setSelectedEmoji('');
    setLoading(false);

    toast({
      title: 'Avatar uploaded!',
      description: 'Click Save Changes to apply',
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setAvatarUrl(emoji);
    setUploadMode('emoji');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        avatar_url: avatarUrl,
        full_name: fullName,
      });

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    setLoading(false);

    if (profileError || authError) {
      toast({
        title: 'Update Error',
        description: profileError?.message || authError?.message,
        variant: 'destructive',
      });
    } else {
      // Track profile updated event
      posthog.capture('profile_updated', {
        has_avatar: !!avatarUrl,
        avatar_type: selectedEmoji ? 'emoji' : 'image',
        name_changed: fullName !== user?.user_metadata?.full_name,
      });

      toast({
        title: 'Profile Updated!',
        description: 'Your changes have been saved',
      });
    }
  };

  const currentAvatar = selectedEmoji || avatarUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#09090b] via-[#0f0f14] to-[#09090b] p-4 sm:p-6 md:p-8">
<div className="max-w-4xl mx-auto space-y-6">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Your Profile
            </h1>
            <p className="text-zinc-400">Customize your avatar and personal info</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-zinc-200">
                    Profile Avatar
                  </label>

                  {/* Current Avatar Display */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border-2 border-zinc-700 overflow-hidden">
                      {currentAvatar ? (
                        currentAvatar.length <= 2 ? (
                          <span className="text-5xl">{currentAvatar}</span>
                        ) : (
                          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <UserIcon className="w-12 h-12 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300 font-medium">{fullName || 'Your Name'}</p>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* Upload Mode Toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={uploadMode === 'emoji' ? 'default' : 'outline'}
                      onClick={() => setUploadMode('emoji')}
                      className="flex-1"
                    >
                      Choose Emoji
                    </Button>
                    <Button
                      type="button"
                      variant={uploadMode === 'upload' ? 'default' : 'outline'}
                      onClick={() => setUploadMode('upload')}
                      className="flex-1"
                    >
                      Upload Image
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {uploadMode === 'emoji' ? (
                      <motion.div
                        key="emoji"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700"
                      >
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                          {AVAILABLE_AVATARS.map((emoji, idx) => (
                            <motion.button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.01 }}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className={`
                                relative w-14 h-14 flex items-center justify-center text-3xl rounded-xl
                                transition-all duration-200
                                ${selectedEmoji === emoji 
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400 shadow-lg shadow-blue-500/50' 
                                  : 'bg-zinc-700/50 hover:bg-zinc-600/60'}
                              `}
                            >
                              {emoji}
                              {selectedEmoji === emoji && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-6 bg-zinc-800/50 rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500 transition-colors"
                      >
                        <label className="flex flex-col items-center cursor-pointer">
                          <Upload className="w-10 h-10 text-zinc-400 mb-2" />
                          <p className="text-sm text-zinc-300 font-medium mb-1">Upload custom avatar</p>
                          <p className="text-xs text-zinc-500">PNG, JPG up to 2MB</p>
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-zinc-800/50 border-zinc-700 text-white"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-200">Email</label>
                  <Input
                    value={user?.email ?? ''}
                    disabled
                    className="bg-zinc-800/30 border-zinc-700 text-zinc-400 cursor-not-allowed"
                  />
                </div>

                {/* Save Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}