-- ============================================
-- Genie Tutor: Database Migration
-- Tables for student knowledge model and spaced repetition
-- Run this in Supabase SQL Editor
-- ============================================

-- Student Knowledge State
-- Tracks per-concept understanding for each user
CREATE TABLE IF NOT EXISTS student_knowledge_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  graph_id TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  depth REAL NOT NULL DEFAULT 0.3,
  attempts INTEGER NOT NULL DEFAULT 0,
  misconceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_style TEXT NOT NULL DEFAULT 'unknown',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, concept_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_sks_user_skill
  ON student_knowledge_state (user_id, skill_id);

-- Spaced Repetition Queue
-- SM-2 review scheduling for each concept per user
CREATE TABLE IF NOT EXISTS spaced_repetition_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_quality INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, concept_id)
);

-- Index for fast due-topic lookup: WHERE user_id = ? AND next_review_at <= now()
CREATE INDEX IF NOT EXISTS idx_srq_user_due
  ON spaced_repetition_queue (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_srq_user_skill
  ON spaced_repetition_queue (user_id, skill_id);

-- ============================================
-- DB-Level Safety: Immutable created_at
-- Even if the app layer accidentally sends created_at in an upsert,
-- this trigger preserves the original value on UPDATE.
-- ============================================

CREATE OR REPLACE FUNCTION protect_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sks_protect_created_at ON student_knowledge_state;
CREATE TRIGGER trg_sks_protect_created_at
  BEFORE UPDATE ON student_knowledge_state
  FOR EACH ROW
  EXECUTE FUNCTION protect_created_at();

DROP TRIGGER IF EXISTS trg_srq_protect_created_at ON spaced_repetition_queue;
CREATE TRIGGER trg_srq_protect_created_at
  BEFORE UPDATE ON spaced_repetition_queue
  FOR EACH ROW
  EXECUTE FUNCTION protect_created_at();
