'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { type User } from '@supabase/supabase-js';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Saved Items State
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ✅ Pagination
  const ITEMS_PER_PAGE = 6;
  const [page, setPage] = useState(1);

  // ✅ Preview Modal
  const [previewItem, setPreviewItem] = useState<any>(null);

  // ✅ Fetch user + saved content
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) {
        setSavedLoading(false);
        return;
      }

      setUser(currentUser);
      setFullName(currentUser?.user_metadata?.full_name ?? '');

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
    };

    fetchData();
  }, [supabase]);

  // ✅ Search Logic
  useEffect(() => {
    const results = savedItems.filter((item) =>
      item.content?.title?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredItems(results);
    setPage(1);
  }, [search, savedItems]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ✅ Update Profile
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

  // ✅ Delete Saved Item
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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">User Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="saved">Saved Items</TabsTrigger>
        </TabsList>

        {/* ✅ PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdate} className="grid gap-4">
                <div>
                  <label>Email</label>
                  <Input value={user?.email ?? ''} disabled />
                </div>

                <div>
                  <label>Full Name</label>
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

        {/* ✅ SAVED ITEMS TAB */}
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

              {/* ✅ Pagination Controls */}
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
      </Tabs>

      {/* ✅ PREVIEW MODAL */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewItem?.content?.title}</DialogTitle>
            <DialogDescription>
              {previewItem?.content?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(previewItem?.content, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
