-- ============================================
-- Interactive Course Experience Database Schema
-- Migration for conversational learning sessions and conversation history
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: interactive_course_sessions
-- Tracks conversational learning sessions between learners and Genie
-- ============================================
CREATE TABLE IF NOT EXISTS interactive_course_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_topic TEXT,
  learning_context JSONB DEFAULT '{}'::jsonb,
  progress_state JSONB DEFAULT '{}'::jsonb,
  session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, is_active) -- Only one active session per user per course
);

-- ============================================
-- Table: conversation_messages
-- Stores individual messages in conversational learning sessions
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interactive_course_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('genie', 'learner')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('explanation', 'question', 'assessment', 'challenge', 'feedback', 'encouragement', 'summary')),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: understanding_assessments
-- Tracks interactive understanding gauges and comprehension results
-- ============================================
CREATE TABLE IF NOT EXISTS understanding_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interactive_course_sessions(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false', 'drag_drop')),
  question_data JSONB NOT NULL,
  learner_response TEXT,
  is_correct BOOLEAN,
  comprehension_level DECIMAL(3,2) CHECK (comprehension_level >= 0 AND comprehension_level <= 1),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Table: contextual_challenges
-- Links challenges to specific learning contexts within sessions
-- ============================================
CREATE TABLE IF NOT EXISTS contextual_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interactive_course_sessions(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  current_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
  conversational_intro TEXT,
  connection_to_topic TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
  presented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  success BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: learning_loop_iterations
-- Tracks the learning loop cycles (explanation → assessment → challenge → evaluation)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_loop_iterations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interactive_course_sessions(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL,
  concept TEXT NOT NULL,
  explanation_completed BOOLEAN DEFAULT FALSE,
  assessment_completed BOOLEAN DEFAULT FALSE,
  challenge_completed BOOLEAN DEFAULT FALSE,
  evaluation_completed BOOLEAN DEFAULT FALSE,
  mastery_achieved BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- interactive_course_sessions indexes
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_user_id ON interactive_course_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_course_id ON interactive_course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_active ON interactive_course_sessions(user_id, course_id, is_active);
CREATE INDEX IF NOT EXISTS idx_interactive_sessions_last_interaction ON interactive_course_sessions(last_interaction DESC);

-- conversation_messages indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp ON conversation_messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_type ON conversation_messages(message_type);

-- understanding_assessments indexes
CREATE INDEX IF NOT EXISTS idx_understanding_assessments_session_id ON understanding_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_understanding_assessments_concept ON understanding_assessments(concept);
CREATE INDEX IF NOT EXISTS idx_understanding_assessments_created_at ON understanding_assessments(created_at DESC);

-- contextual_challenges indexes
CREATE INDEX IF NOT EXISTS idx_contextual_challenges_session_id ON contextual_challenges(session_id);
CREATE INDEX IF NOT EXISTS idx_contextual_challenges_skill_id ON contextual_challenges(skill_id);
CREATE INDEX IF NOT EXISTS idx_contextual_challenges_challenge_id ON contextual_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_contextual_challenges_presented_at ON contextual_challenges(presented_at DESC);

-- learning_loop_iterations indexes
CREATE INDEX IF NOT EXISTS idx_learning_loop_iterations_session_id ON learning_loop_iterations(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_loop_iterations_concept ON learning_loop_iterations(concept);
CREATE INDEX IF NOT EXISTS idx_learning_loop_iterations_iteration ON learning_loop_iterations(session_id, iteration_number);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE interactive_course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE understanding_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contextual_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_loop_iterations ENABLE ROW LEVEL SECURITY;

-- interactive_course_sessions policies
CREATE POLICY "Users can view their own course sessions"
  ON interactive_course_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own course sessions"
  ON interactive_course_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course sessions"
  ON interactive_course_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course sessions"
  ON interactive_course_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- conversation_messages policies
CREATE POLICY "Users can view messages from their sessions"
  ON conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = conversation_messages.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON conversation_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = conversation_messages.session_id 
      AND user_id = auth.uid()
    )
  );

-- understanding_assessments policies
CREATE POLICY "Users can view assessments from their sessions"
  ON understanding_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = understanding_assessments.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create assessments in their sessions"
  ON understanding_assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = understanding_assessments.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assessments in their sessions"
  ON understanding_assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = understanding_assessments.session_id 
      AND user_id = auth.uid()
    )
  );

-- contextual_challenges policies
CREATE POLICY "Users can view challenges from their sessions"
  ON contextual_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = contextual_challenges.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create challenges in their sessions"
  ON contextual_challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = contextual_challenges.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update challenges in their sessions"
  ON contextual_challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = contextual_challenges.session_id 
      AND user_id = auth.uid()
    )
  );

-- learning_loop_iterations policies
CREATE POLICY "Users can view loop iterations from their sessions"
  ON learning_loop_iterations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = learning_loop_iterations.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create loop iterations in their sessions"
  ON learning_loop_iterations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = learning_loop_iterations.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update loop iterations in their sessions"
  ON learning_loop_iterations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM interactive_course_sessions 
      WHERE id = learning_loop_iterations.session_id 
      AND user_id = auth.uid()
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

-- Trigger for updated_at column on interactive_course_sessions
CREATE TRIGGER update_interactive_course_sessions_updated_at
  BEFORE UPDATE ON interactive_course_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_interaction when messages are added
CREATE OR REPLACE FUNCTION update_session_last_interaction()
RETURNS TRIGGER AS $
BEGIN
  UPDATE interactive_course_sessions 
  SET last_interaction = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update last_interaction on new messages
CREATE TRIGGER update_session_interaction_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_interaction();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to create or resume an interactive course session
CREATE OR REPLACE FUNCTION create_or_resume_session(
  p_user_id UUID,
  p_course_id TEXT
)
RETURNS UUID AS $
DECLARE
  v_session_id UUID;
  v_existing_session interactive_course_sessions%ROWTYPE;
BEGIN
  -- Check for existing active session
  SELECT * INTO v_existing_session
  FROM interactive_course_sessions
  WHERE user_id = p_user_id 
    AND course_id = p_course_id 
    AND is_active = TRUE;
  
  IF FOUND THEN
    -- Resume existing session
    UPDATE interactive_course_sessions
    SET last_interaction = NOW()
    WHERE id = v_existing_session.id;
    
    RETURN v_existing_session.id;
  ELSE
    -- Create new session
    INSERT INTO interactive_course_sessions (user_id, course_id)
    VALUES (p_user_id, p_course_id)
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a conversation message
CREATE OR REPLACE FUNCTION add_conversation_message(
  p_session_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_message_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO conversation_messages (
    session_id, role, content, message_type, metadata
  ) VALUES (
    p_session_id, p_role, p_content, p_message_type, p_metadata
  ) RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record understanding assessment
CREATE OR REPLACE FUNCTION record_understanding_assessment(
  p_session_id UUID,
  p_concept TEXT,
  p_question_type TEXT,
  p_question_data JSONB,
  p_learner_response TEXT DEFAULT NULL,
  p_is_correct BOOLEAN DEFAULT NULL,
  p_comprehension_level DECIMAL DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
)
RETURNS UUID AS $
DECLARE
  v_assessment_id UUID;
BEGIN
  INSERT INTO understanding_assessments (
    session_id, concept, question_type, question_data,
    learner_response, is_correct, comprehension_level, feedback,
    answered_at
  ) VALUES (
    p_session_id, p_concept, p_question_type, p_question_data,
    p_learner_response, p_is_correct, p_comprehension_level, p_feedback,
    CASE WHEN p_learner_response IS NOT NULL THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_assessment_id;
  
  RETURN v_assessment_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session conversation history
CREATE OR REPLACE FUNCTION get_session_conversation(
  p_session_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  message_id UUID,
  role TEXT,
  content TEXT,
  message_type TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.role,
    cm.content,
    cm.message_type,
    cm.metadata,
    cm.timestamp
  FROM conversation_messages cm
  WHERE cm.session_id = p_session_id
  ORDER BY cm.timestamp DESC
  LIMIT p_limit;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end a session
CREATE OR REPLACE FUNCTION end_session(
  p_session_id UUID
)
RETURNS BOOLEAN AS $
BEGIN
  UPDATE interactive_course_sessions
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN FOUND;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE! 🎉
-- ============================================
-- This migration creates the interactive course experience tables
-- with proper RLS policies and helper functions for session management