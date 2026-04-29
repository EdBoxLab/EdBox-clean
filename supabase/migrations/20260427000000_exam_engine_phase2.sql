-- Exam Engine Phase 2: SM-2 scheduling, StudyCast episodes, official audio plugin

CREATE TABLE IF NOT EXISTS user_question_sm2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES exam_domains(id) ON DELETE SET NULL,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  repetitions INTEGER NOT NULL DEFAULT 0,
  last_grade INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_studycast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES exam_domains(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  script_markdown TEXT NOT NULL,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'failed')),
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, domain_id)
);

CREATE TABLE IF NOT EXISTS exam_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exam_kits(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES exam_domains(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_type TEXT NOT NULL DEFAULT 'official' CHECK (file_type IN ('official', 'instructor', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_question_sm2_user_exam_idx ON user_question_sm2(user_id, exam_id, next_review_date);
CREATE INDEX IF NOT EXISTS user_question_sm2_user_domain_idx ON user_question_sm2(user_id, domain_id, next_review_date);
CREATE INDEX IF NOT EXISTS exam_studycast_episodes_exam_domain_idx ON exam_studycast_episodes(exam_id, domain_id);
CREATE INDEX IF NOT EXISTS exam_audio_files_exam_active_idx ON exam_audio_files(exam_id, is_active, created_at DESC);

ALTER TABLE user_question_sm2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_studycast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SM2 records"
  ON user_question_sm2 FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public studycast episodes are readable"
  ON exam_studycast_episodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_kits
      WHERE exam_kits.id = exam_studycast_episodes.exam_id
      AND exam_kits.active = TRUE
    )
  );

CREATE POLICY "Public official audio is readable"
  ON exam_audio_files FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM exam_kits
      WHERE exam_kits.id = exam_audio_files.exam_id
      AND exam_kits.active = TRUE
    )
  );

CREATE TRIGGER update_user_question_sm2_updated_at
  BEFORE UPDATE ON user_question_sm2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_studycast_episodes_updated_at
  BEFORE UPDATE ON exam_studycast_episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_audio_files_updated_at
  BEFORE UPDATE ON exam_audio_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
