-- ============================================
-- Skill Progression System Database Schema
-- Migration for comprehensive skill progression and challenge system
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: user_skill_progress
-- Tracks detailed progress for each user-skill combination
-- ============================================
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  challenges_required INTEGER DEFAULT 3,
  success_rate DECIMAL(5,4) DEFAULT 0.0000 CHECK (success_rate >= 0 AND success_rate <= 1),
  mastery_achieved BOOLEAN DEFAULT FALSE,
  last_attempt TIMESTAMP WITH TIME ZONE,
  total_attempts INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ============================================
-- Table: challenge_attempts
-- Records individual challenge attempts and results
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  time_spent INTEGER, -- in seconds
  hints_used INTEGER DEFAULT 0,
  submission_code TEXT,
  feedback TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: skill_configurations
-- Stores mastery thresholds and challenge settings per skill
-- ============================================
CREATE TABLE IF NOT EXISTS skill_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id TEXT NOT NULL UNIQUE,
  min_success_rate DECIMAL(5,4) DEFAULT 0.7000 CHECK (min_success_rate >= 0 AND min_success_rate <= 1),
  challenges_required INTEGER DEFAULT 3 CHECK (challenges_required > 0),
  max_challenges INTEGER DEFAULT 10 CHECK (max_challenges >= challenges_required),
  starting_difficulty TEXT DEFAULT 'Medium' CHECK (starting_difficulty IN ('Easy', 'Medium', 'Hard')),
  adaptive_scaling BOOLEAN DEFAULT TRUE,
  challenge_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- user_skill_progress indexes
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user_id ON user_skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_skill_id ON user_skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_composite ON user_skill_progress(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_mastery ON user_skill_progress(mastery_achieved);

-- challenge_attempts indexes
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_skill_id ON challenge_attempts(skill_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_skill ON challenge_attempts(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_timestamp ON challenge_attempts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_success ON challenge_attempts(success);

-- skill_configurations indexes
CREATE INDEX IF NOT EXISTS idx_skill_configurations_skill_id ON skill_configurations(skill_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_configurations ENABLE ROW LEVEL SECURITY;

-- user_skill_progress policies
CREATE POLICY "Users can view their own skill progress"
  ON user_skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skill progress"
  ON user_skill_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill progress"
  ON user_skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill progress"
  ON user_skill_progress FOR DELETE
  USING (auth.uid() = user_id);

-- challenge_attempts policies
CREATE POLICY "Users can view their own challenge attempts"
  ON challenge_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own challenge attempts"
  ON challenge_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge attempts"
  ON challenge_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- skill_configurations policies (read-only for users, admin-managed)
CREATE POLICY "Users can view skill configurations"
  ON skill_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Admin policies for skill_configurations (assuming admin role exists)
CREATE POLICY "Admins can manage skill configurations"
  ON skill_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions 
      WHERE user_id = auth.uid() 
      AND plan_id = 'admin'
    )
  );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_user_skill_progress_updated_at
  BEFORE UPDATE ON user_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_configurations_updated_at
  BEFORE UPDATE ON skill_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to record a challenge attempt and update progress
CREATE OR REPLACE FUNCTION record_challenge_attempt(
  p_user_id UUID,
  p_skill_id TEXT,
  p_challenge_id TEXT,
  p_success BOOLEAN,
  p_time_spent INTEGER DEFAULT NULL,
  p_hints_used INTEGER DEFAULT 0,
  p_submission_code TEXT DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL,
  p_difficulty_level TEXT DEFAULT 'Medium'
)
RETURNS JSONB AS $
DECLARE
  v_progress_record user_skill_progress%ROWTYPE;
  v_config_record skill_configurations%ROWTYPE;
  v_new_success_rate DECIMAL(5,4);
  v_mastery_achieved BOOLEAN := FALSE;
  v_xp_awarded INTEGER := 0;
BEGIN
  -- Get skill configuration
  SELECT * INTO v_config_record 
  FROM skill_configurations 
  WHERE skill_id = p_skill_id;
  
  -- If no config exists, create default
  IF NOT FOUND THEN
    INSERT INTO skill_configurations (skill_id) 
    VALUES (p_skill_id)
    RETURNING * INTO v_config_record;
  END IF;
  
  -- Record the challenge attempt
  INSERT INTO challenge_attempts (
    user_id, skill_id, challenge_id, success, time_spent, 
    hints_used, submission_code, feedback, difficulty_level
  ) VALUES (
    p_user_id, p_skill_id, p_challenge_id, p_success, p_time_spent,
    p_hints_used, p_submission_code, p_feedback, p_difficulty_level
  );
  
  -- Get or create user progress record
  INSERT INTO user_skill_progress (user_id, skill_id, challenges_required)
  VALUES (p_user_id, p_skill_id, v_config_record.challenges_required)
  ON CONFLICT (user_id, skill_id) DO NOTHING;
  
  SELECT * INTO v_progress_record 
  FROM user_skill_progress 
  WHERE user_id = p_user_id AND skill_id = p_skill_id;
  
  -- Calculate new success rate
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(COUNT(*) FILTER (WHERE success = TRUE)::DECIMAL / COUNT(*), 4)
    END
  INTO v_new_success_rate
  FROM challenge_attempts 
  WHERE user_id = p_user_id AND skill_id = p_skill_id;
  
  -- Update challenges completed if this was successful
  IF p_success THEN
    v_progress_record.challenges_completed := v_progress_record.challenges_completed + 1;
    
    -- Award XP based on difficulty
    v_xp_awarded := CASE p_difficulty_level
      WHEN 'Easy' THEN 10
      WHEN 'Medium' THEN 20
      WHEN 'Hard' THEN 30
      ELSE 20
    END;
  END IF;
  
  -- Check for mastery achievement
  IF v_progress_record.challenges_completed >= v_config_record.challenges_required 
     AND v_new_success_rate >= v_config_record.min_success_rate THEN
    v_mastery_achieved := TRUE;
    -- Bonus XP for mastery
    v_xp_awarded := v_xp_awarded + 50;
  END IF;
  
  -- Update progress record
  UPDATE user_skill_progress SET
    challenges_completed = v_progress_record.challenges_completed,
    success_rate = v_new_success_rate,
    mastery_achieved = v_mastery_achieved,
    last_attempt = NOW(),
    total_attempts = total_attempts + 1,
    xp_earned = xp_earned + v_xp_awarded,
    updated_at = NOW()
  WHERE user_id = p_user_id AND skill_id = p_skill_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'mastery_achieved', v_mastery_achieved,
    'xp_awarded', v_xp_awarded,
    'success_rate', v_new_success_rate,
    'challenges_completed', v_progress_record.challenges_completed,
    'challenges_required', v_config_record.challenges_required
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's progress for a skill
CREATE OR REPLACE FUNCTION get_skill_progress(
  p_user_id UUID,
  p_skill_id TEXT
)
RETURNS JSONB AS $
DECLARE
  v_progress user_skill_progress%ROWTYPE;
  v_config skill_configurations%ROWTYPE;
BEGIN
  -- Get progress record
  SELECT * INTO v_progress 
  FROM user_skill_progress 
  WHERE user_id = p_user_id AND skill_id = p_skill_id;
  
  -- Get configuration
  SELECT * INTO v_config 
  FROM skill_configurations 
  WHERE skill_id = p_skill_id;
  
  -- Return combined data
  RETURN jsonb_build_object(
    'skill_id', p_skill_id,
    'challenges_completed', COALESCE(v_progress.challenges_completed, 0),
    'challenges_required', COALESCE(v_config.challenges_required, 3),
    'success_rate', COALESCE(v_progress.success_rate, 0),
    'mastery_achieved', COALESCE(v_progress.mastery_achieved, FALSE),
    'xp_earned', COALESCE(v_progress.xp_earned, 0),
    'total_attempts', COALESCE(v_progress.total_attempts, 0),
    'last_attempt', v_progress.last_attempt
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Seed Data - Default Skill Configurations
-- ============================================

-- Insert default configurations for common skills
INSERT INTO skill_configurations (skill_id, min_success_rate, challenges_required, max_challenges, starting_difficulty) 
VALUES 
  ('javascript-basics', 0.7000, 3, 8, 'Easy'),
  ('python-fundamentals', 0.7000, 3, 8, 'Easy'),
  ('html-css-basics', 0.6000, 2, 6, 'Easy'),
  ('react-components', 0.8000, 4, 10, 'Medium'),
  ('database-queries', 0.7500, 3, 7, 'Medium'),
  ('algorithms-sorting', 0.8000, 5, 10, 'Hard'),
  ('data-structures', 0.8000, 5, 10, 'Hard')
ON CONFLICT (skill_id) DO NOTHING;

-- ============================================
-- DONE! 🎉
-- ============================================
-- This migration creates the skill progression system tables
-- with proper RLS policies and helper functions