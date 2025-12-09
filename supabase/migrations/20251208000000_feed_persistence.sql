-- Feed items cache to store generated content
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User interactions with feed items
CREATE TABLE IF NOT EXISTS user_feed_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  feed_item_id UUID REFERENCES feed_items(id),
  interaction_type TEXT NOT NULL, -- 'like', 'dislike', 'save', 'skip', 'got_it'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved items specifically (for quick access to bookmarks)
CREATE TABLE IF NOT EXISTS saved_feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  feed_item_id UUID, -- Can reference feed_items or be standalone if source is deleted
  feed_item_type TEXT,
  content JSONB,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats for gamification
CREATE TABLE IF NOT EXISTS user_feed_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_stats ENABLE ROW LEVEL SECURITY;

-- Policies (Basic open policies for now, refine for production)
CREATE POLICY "Users can insert their own feed items" ON feed_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own feed items" ON feed_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their interactions" ON user_feed_interactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage saved items" ON saved_feed_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own stats" ON user_feed_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_feed_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON user_feed_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
