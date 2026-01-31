-- RPC: Get Session Conversation (Crucial for frontend loading)
CREATE OR REPLACE FUNCTION get_session_conversation(p_session_id uuid, p_limit integer DEFAULT 50)
RETURNS TABLE (
  message_id uuid,
  session_id uuid,
  role text,
  content text,
  message_type text,
  metadata jsonb,
  timestamp timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id as message_id,
    cm.session_id,
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
$$ LANGUAGE plpgsql;

-- RPC: Add Message (Used by client service)
CREATE OR REPLACE FUNCTION add_conversation_message(
  p_session_id uuid,
  p_role text,
  p_content text,
  p_message_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_message_id uuid;
BEGIN
  INSERT INTO conversation_messages (session_id, role, content, message_type, metadata)
  VALUES (p_session_id, p_role, p_content, p_message_type, p_metadata)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;
