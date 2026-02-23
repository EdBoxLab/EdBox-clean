-- Migration: Create pulse_widget_bank and skill_session_progress tables
-- For Genie-driven skill mastery + widget persistence

-- 1. Widget Bank — persists all widgets deployed during sessions
CREATE TABLE IF NOT EXISTS public.pulse_widget_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  widget_type text NOT NULL,
  widget_title text,
  widget_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT pulse_widget_bank_pkey PRIMARY KEY (id),
  CONSTRAINT pulse_widget_bank_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_widget_bank_user_id ON public.pulse_widget_bank USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_widget_bank_session_id ON public.pulse_widget_bank USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_widget_bank_user_session ON public.pulse_widget_bank USING btree (user_id, session_id);

-- 2. Skill Session Progress — tracks Genie's dynamic curriculum progress per skill
CREATE TABLE IF NOT EXISTS public.skill_session_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id text NOT NULL,
  graph_id uuid NOT NULL,
  curriculum jsonb DEFAULT '[]'::jsonb,
  current_stage text DEFAULT 'Foundation',
  topics_covered jsonb DEFAULT '[]'::jsonb,
  mastery_signals jsonb DEFAULT '{}'::jsonb,
  conversation_summary text,
  status text DEFAULT 'in_progress',
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT skill_session_progress_pkey PRIMARY KEY (id),
  CONSTRAINT skill_session_progress_user_skill_key UNIQUE (user_id, skill_id, graph_id),
  CONSTRAINT skill_session_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT skill_session_progress_status_check CHECK (
    status = ANY(ARRAY['in_progress', 'completed', 'paused'])
  )
);

CREATE INDEX IF NOT EXISTS idx_session_progress_user_id ON public.skill_session_progress USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_skill_id ON public.skill_session_progress USING btree (skill_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_graph_id ON public.skill_session_progress USING btree (graph_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_status ON public.skill_session_progress USING btree (status);

-- Enable RLS
ALTER TABLE public.pulse_widget_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_session_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users can only access their own data
CREATE POLICY "Users can manage their own widgets" ON public.pulse_widget_bank
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session progress" ON public.skill_session_progress
  FOR ALL USING (auth.uid() = user_id);
