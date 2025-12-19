-- Create share_events table for tracking content shares
CREATE TABLE IF NOT EXISTS share_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL, -- 'course', 'studylist', 'learning-path'
    content_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'twitter', 'facebook', 'linkedin', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_events_content ON share_events(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_platform ON share_events(platform);
CREATE INDEX IF NOT EXISTS idx_share_events_shared_at ON share_events(shared_at);

-- Enable RLS (Row Level Security)
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert share events" ON share_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own share events" ON share_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public read access for share counts" ON share_events
    FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON share_events TO anon;
GRANT SELECT, INSERT ON share_events TO authenticated;

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
    COUNT(CASE WHEN platform = 'copy_link' THEN 1 END) as link_copies,
    MAX(shared_at) as last_shared_at,
    MIN(shared_at) as first_shared_at
FROM share_events
GROUP BY content_type, content_id;

-- Grant access to the view
GRANT SELECT ON share_statistics TO anon;
GRANT SELECT ON share_statistics TO authenticated;