'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const SavedItemsPage = () => {
  const supabase = createSupabaseBrowserClient();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedItems = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_feed_items')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved items:', error);
      } else {
        setSavedItems(data);
      }
      setLoading(false);
    };

    fetchSavedItems();
  }, [supabase]);

  if (loading) {
    return <div>Loading saved items...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Saved Items</h1>
      {savedItems.length === 0 ? (
        <p>You haven't saved any items yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <h2 className="font-bold">{item.content.title}</h2>
              <p>{item.content.type}</p>
              {/* You can add more details from item.content here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedItemsPage;
