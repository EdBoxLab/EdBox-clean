-- =====================================================
-- SUPABASE DATABASE SCHEMA FOR EDBOX TOOLS
-- Run these queries in your Supabase SQL Editor
-- =====================================================

-- 1. NOTES TABLE (for Note Taker)
-- =====================================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);


-- 2. AI CHAT CONVERSATIONS TABLE (for AI Genie)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for chat conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
    ON chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON chat_conversations(user_id);


-- 3. AI CHAT MESSAGES TABLE (for AI Genie)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for chat messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

-- Create index
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);


-- 4. STUDY KIT GENERATED CONTENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS study_kit_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('text', 'file')),
    source_content TEXT,
    file_name TEXT,
    content_types TEXT[] NOT NULL, -- ['quizzes', 'flashcards', 'notes', 'mindmaps']
    generated_content JSONB NOT NULL, -- Stores all generated content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE study_kit_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study kit content"
    ON study_kit_content FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study kit content"
    ON study_kit_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study kit content"
    ON study_kit_content FOR DELETE
    USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS study_kit_content_user_id_idx ON study_kit_content(user_id);
CREATE INDEX IF NOT EXISTS study_kit_content_created_at_idx ON study_kit_content(created_at DESC);


-- 5. FUNCTION TO UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify tables were created successfully:

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notes', 'chat_conversations', 'chat_messages', 'study_kit_content');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('notes', 'chat_conversations', 'chat_messages', 'study_kit_content');


-- 6. PAYMENT & SUBSCRIPTION SYSTEM
-- =====================================================

-- Table to store user subscription details (synced with Stripe)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_id TEXT, -- 'free', 'pro_monthly', 'pro_quarterly', 'pro_yearly'
    status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
    billing_interval TEXT, -- 'month', 'year', 'quarter'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role (webhooks) should update this table typically, but for safety:
-- No INSERT/UPDATE policy for authenticated users if we handle via webhooks only.
-- If client-side creation is needed (not recommended), add policies.


-- 7. USAGE TRACKING & RATE LIMITING
-- =====================================================

CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Usage Counts
    courses_created_month INTEGER DEFAULT 0,
    study_kits_created_week INTEGER DEFAULT 0,
    research_queries_week INTEGER DEFAULT 0,
    
    -- Ad Credits (watched ads to bypass limits)
    ad_credits INTEGER DEFAULT 0,
    
    -- Reset Timestamps
    last_reset_month TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_week TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
    ON user_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Users typically shouldn't update this directly; API actions should increment via secure RPC or server-side API.
-- However, if implementing client-side logic (less secure), we might need policies. 
-- Best practice: Use Database Functions (RPC) for incrementing usage to ensure atomicity and security.

-- FUNCTION: Increment Usage Safely
CREATE OR REPLACE FUNCTION increment_usage(
    row_user_id UUID, 
    usage_type TEXT -- 'course', 'study_kit', 'research'
)
RETURNS JSONB AS $$
DECLARE
    usage_record RECORD;
    limit_reached BOOLEAN := FALSE;
    usage_col TEXT;
    limit_val INTEGER;
BEGIN
    -- Get current usage record, create if not exists
    INSERT INTO user_usage (user_id) VALUES (row_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO usage_record FROM user_usage WHERE user_id = row_user_id;
    
    -- Determine column and limit based on type (Hardcoded limits for 'free' tier logic references)
    -- Real enforcement check should happen in API before calling this, or logic here can be expanded.
    IF usage_type = 'course' THEN
        UPDATE user_usage 
        SET courses_created_month = courses_created_month + 1, updated_at = NOW()
        WHERE user_id = row_user_id;
    ELSIF usage_type = 'study_kit' THEN
        UPDATE user_usage 
        SET study_kits_created_week = study_kits_created_week + 1, updated_at = NOW()
        WHERE user_id = row_user_id;
    ELSIF usage_type = 'research' THEN
        UPDATE user_usage 
        SET research_queries_week = research_queries_week + 1, updated_at = NOW()
        WHERE user_id = row_user_id;
    END IF;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Consume Ad Credit
CREATE OR REPLACE FUNCTION consume_ad_credit(row_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    SELECT ad_credits INTO current_credits FROM user_usage WHERE user_id = row_user_id;
    
    IF current_credits > 0 THEN
        UPDATE user_usage SET ad_credits = ad_credits - 1 WHERE user_id = row_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Triggers for User Creation (ensure usage row exists)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (new.id);
  
  INSERT INTO public.user_subscriptions (user_id, plan_id, status)
  VALUES (new.id, 'free', 'active');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: You might need to attach this to auth.users if not already done.
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexing
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS user_usage_user_id_idx ON user_usage(user_id);

