-- ============================================
-- EdBox Engine-Native Learning System
-- Database Schema for Skill Graphs & Progress
-- FIXED VERSION - Drops existing tables first
-- ============================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS challenges_generated CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS skill_graphs CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: skill_graphs
-- Stores AI-generated skill graphs for users
-- ============================================
CREATE TABLE skill_graphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX idx_skill_graphs_user_id ON skill_graphs(user_id);
CREATE INDEX idx_skill_graphs_created_at ON skill_graphs(created_at DESC);

-- ============================================
-- Table: user_progress
-- Tracks user mastery for each skill
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_graph_id UUID NOT NULL REFERENCES skill_graphs(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  mastery_level FLOAT DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  challenges_completed JSONB DEFAULT '[]'::jsonb,
  last_practiced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_graph_id, skill_id)
);

-- Indexes for faster queries
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_skill_graph_id ON user_progress(skill_graph_id);
CREATE INDEX idx_user_progress_composite ON user_progress(user_id, skill_graph_id);

-- ============================================
-- Table: challenges_generated (Optional - for analytics)
-- Logs all challenges generated for users
-- ============================================
CREATE TABLE challenges_generated (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_graph_id UUID REFERENCES skill_graphs(id) ON DELETE SET NULL,
  skill_id TEXT NOT NULL,
  challenge_data JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_challenges_user_id ON challenges_generated(user_id);
CREATE INDEX idx_challenges_skill_graph_id ON challenges_generated(skill_graph_id);
CREATE INDEX idx_challenges_created_at ON challenges_generated(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE skill_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges_generated ENABLE ROW LEVEL SECURITY;

-- skill_graphs policies
CREATE POLICY "Users can view their own skill graphs"
  ON skill_graphs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skill graphs"
  ON skill_graphs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill graphs"
  ON skill_graphs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill graphs"
  ON skill_graphs FOR DELETE
  USING (auth.uid() = user_id);

-- user_progress policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- challenges_generated policies
CREATE POLICY "Users can view their own challenges"
  ON challenges_generated FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges"
  ON challenges_generated FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON challenges_generated FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for skill_graphs
DROP TRIGGER IF EXISTS update_skill_graphs_updated_at ON skill_graphs;
CREATE TRIGGER update_skill_graphs_updated_at
  BEFORE UPDATE ON skill_graphs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_progress
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get user's skill graph with progress
CREATE OR REPLACE FUNCTION get_skill_graph_with_progress(graph_id UUID)
RETURNS TABLE (
  graph JSONB,
  progress JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(sg.*) as graph,
    COALESCE(
      jsonb_object_agg(up.skill_id, up.mastery_level) FILTER (WHERE up.skill_id IS NOT NULL),
      '{}'::jsonb
    ) as progress
  FROM skill_graphs sg
  LEFT JOIN user_progress up ON sg.id = up.skill_graph_id AND up.user_id = auth.uid()
  WHERE sg.id = graph_id AND sg.user_id = auth.uid()
  GROUP BY sg.id, sg.user_id, sg.goal, sg.nodes, sg.edges, sg.created_at, sg.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! 🎉
-- ============================================
-- This version drops existing tables first to avoid type conflicts
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" to execute all commands
