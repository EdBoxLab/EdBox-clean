-- Create share_events table for tracking sharing analytics
CREATE TABLE IF NOT EXISTS share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_share_events_content ON share_events (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events (user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_platform ON share_events (platform);
CREATE INDEX IF NOT EXISTS idx_share_events_date ON share_events (shared_at);

-- Create a view for share statistics
CREATE OR REPLACE VIEW share_statistics AS
SELECT 
    content_type,
    content_id,
    COUNT(*) as total_shares,
    COUNT(DISTINCT user_id) as unique_sharers,
    COUNT(CASE WHEN platform = 'twitter' THEN 1 END) as twitter_shares,
    COUNT(CASE WHEN platform = 'facebook' THEN 1 END) as facebook_shares,
    COUNT(CASE WHEN platform = 'linkedin' THEN 1 END) as linkedin_shares,
    COUNT(CASE WHEN platform = 'whatsapp' THEN 1 END) as whatsapp_shares,
    COUNT(CASE WHEN platform = 'telegram' THEN 1 END) as telegram_shares,
    COUNT(CASE WHEN platform = 'email' THEN 1 END) as email_shares,
    COUNT(CASE WHEN platform = 'copy' THEN 1 END) as copy_shares,
    COUNT(CASE WHEN platform = 'study_circle' THEN 1 END) as study_circle_shares,
    COUNT(CASE WHEN platform = 'direct_message' THEN 1 END) as direct_message_shares,
    COUNT(CASE WHEN platform = 'native' THEN 1 END) as native_shares,
    MAX(shared_at) as last_shared_at
FROM share_events
GROUP BY content_type, content_id;

-- Enable RLS on share_events table
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all share events" ON share_events
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own share events" ON share_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON share_events TO authenticated;
GRANT SELECT ON share_statistics TO authenticated;