-- Create the main table for Study Circles
CREATE TABLE study_circles (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a junction table for circle members
CREATE TABLE circle_members (
    circle_id BIGINT REFERENCES study_circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (circle_id, user_id)
);

-- Create a table for messages within circles
CREATE TABLE circle_messages (
    id BIGSERIAL PRIMARY KEY,
    circle_id BIGINT REFERENCES study_circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE study_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- 1. Allow users to see all public circles
CREATE POLICY "Allow public read access" ON study_circles FOR SELECT USING (true);

-- 2. Allow users to create new circles
CREATE POLICY "Allow authenticated users to create circles" ON study_circles FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Allow members to see who is in their circle
CREATE POLICY "Allow members to view other members" ON circle_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM circle_members
        WHERE circle_id = circle_members.circle_id AND user_id = auth.uid()
    )
);

-- 4. Allow users to join a circle (or be added)
CREATE POLICY "Allow authenticated users to join circles" ON circle_members FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Allow members to view messages in their circle
CREATE POLICY "Allow members to read messages" ON circle_messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM circle_members
        WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()
    )
);

-- 6. Allow members to send messages in their circle
CREATE POLICY "Allow members to send messages" ON circle_messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM circle_members
        WHERE circle_id = circle_messages.circle_id AND user_id = auth.uid()
    )
);