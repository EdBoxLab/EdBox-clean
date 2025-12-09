-- ============================================
-- Additional Tables for Phase 3 Features
-- Course Sharing, Certificates, and Portfolio
-- ============================================

-- Table: course_shares
-- Stores shareable links for skill graphs
CREATE TABLE IF NOT EXISTS course_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_graph_id UUID NOT NULL REFERENCES skill_graphs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_course_shares_token ON course_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_course_shares_owner ON course_shares(owner_id);

-- Table: certificates
-- Stores generated competency-based certificates
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_graph_id UUID NOT NULL REFERENCES skill_graphs(id) ON DELETE CASCADE,
  certificate_data JSONB NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_graph ON certificates(skill_graph_id);

-- Table: portfolio_items
-- Stores completed work/projects from challenges
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_graph_id UUID REFERENCES skill_graphs(id) ON DELETE SET NULL,
  skill_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  work_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_graph ON portfolio_items(skill_graph_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE course_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- course_shares policies
CREATE POLICY "Users can view their own shares"
  ON course_shares FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create shares"
  ON course_shares FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their shares"
  ON course_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- Public can view shared courses by token
CREATE POLICY "Anyone can view shared courses"
  ON course_shares FOR SELECT
  USING (true);

-- certificates policies
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can verify certificates"
  ON certificates FOR SELECT
  USING (verified = true);

-- portfolio_items policies
CREATE POLICY "Users can view their own portfolio"
  ON portfolio_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create portfolio items"
  ON portfolio_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their portfolio"
  ON portfolio_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their portfolio items"
  ON portfolio_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to increment share view count
CREATE OR REPLACE FUNCTION increment_share_views(share_token_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE course_shares
  SET view_count = view_count + 1
  WHERE share_token = share_token_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! 🎉
-- ============================================
-- Run this migration after the initial schema
