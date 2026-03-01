-- Knowledge Graphs Table
-- Stores the personalized, computed skill CV for each learner.
-- This is SEPARATE from skill_graphs (which stores course content).
-- Knowledge graphs are built by aggregating learning evidence from all sources.

CREATE TABLE IF NOT EXISTS public.knowledge_graphs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Aggregated domain data (computed from courses, Genie sessions, Pulse)
  domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{ name: "Python", graphId: "...", domainScore: 72, skills: [...] }]
  
  -- Radar chart data (top 6 domains)
  radar_labels text[] NOT NULL DEFAULT ARRAY[]::text[],
  radar_values integer[] NOT NULL DEFAULT ARRAY[]::integer[],
  
  -- Overall stats
  overall_cv_score integer NOT NULL DEFAULT 0,
  total_skills_tracked integer NOT NULL DEFAULT 0,
  total_evidence_points integer NOT NULL DEFAULT 0,
  strongest_domain text,
  
  -- Activity timeline (last 364 days)
  activity_timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT knowledge_graphs_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_graphs_user_id_key UNIQUE (user_id),
  CONSTRAINT knowledge_graphs_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_graphs_user_id 
  ON public.knowledge_graphs USING btree (user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_knowledge_graphs_updated_at
  BEFORE UPDATE ON knowledge_graphs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.knowledge_graphs ENABLE ROW LEVEL SECURITY;

-- Users can read their own knowledge graph
CREATE POLICY "Users can read own knowledge graph"
  ON public.knowledge_graphs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own knowledge graph
CREATE POLICY "Users can upsert own knowledge graph"
  ON public.knowledge_graphs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge graph"
  ON public.knowledge_graphs FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read access for shareable profiles (anyone can view any knowledge graph)
CREATE POLICY "Public can read knowledge graphs"
  ON public.knowledge_graphs FOR SELECT
  USING (true);
