-- Exam Engine schema: kits, domains, materials, questions, attempts

CREATE TABLE IF NOT EXISTS exam_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  jurisdiction TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  passing_score INTEGER NOT NULL DEFAULT 70,
  price_cents INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_study_kit_id UUID REFERENCES study_kit_content(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  weight NUMERIC(6,4) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, slug)
);

CREATE TABLE IF NOT EXISTS exam_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES exam_domains(id) ON DELETE SET NULL,
  study_kit_content_id UUID REFERENCES study_kit_content(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  content_text TEXT,
  content_jsonb JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES exam_domains(id) ON DELETE CASCADE,
  material_id UUID REFERENCES exam_materials(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'scenario')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 3,
  source_excerpt TEXT,
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES exam_domains(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exam_kits_active_idx ON exam_kits(active, slug);
CREATE INDEX IF NOT EXISTS exam_domains_exam_idx ON exam_domains(exam_id, order_index);
CREATE INDEX IF NOT EXISTS exam_materials_exam_idx ON exam_materials(exam_id, domain_id);
CREATE INDEX IF NOT EXISTS exam_questions_exam_domain_idx ON exam_questions(exam_id, domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS exam_attempts_user_idx ON exam_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS exam_attempts_exam_idx ON exam_attempts(exam_id, created_at DESC);

ALTER TABLE exam_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public kits are readable"
  ON exam_kits FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Public exam domains are readable"
  ON exam_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_kits
      WHERE exam_kits.id = exam_domains.exam_id
      AND exam_kits.active = TRUE
    )
  );

CREATE POLICY "Public exam materials are readable"
  ON exam_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_kits
      WHERE exam_kits.id = exam_materials.exam_id
      AND exam_kits.active = TRUE
    )
  );

CREATE POLICY "Public exam questions are readable"
  ON exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_kits
      WHERE exam_kits.id = exam_questions.exam_id
      AND exam_kits.active = TRUE
    )
  );

CREATE POLICY "Users can view their own exam attempts"
  ON exam_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exam attempts"
  ON exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_exam_kits_updated_at
  BEFORE UPDATE ON exam_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_domains_updated_at
  BEFORE UPDATE ON exam_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_materials_updated_at
  BEFORE UPDATE ON exam_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_questions_updated_at
  BEFORE UPDATE ON exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();