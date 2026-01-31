-- Create conversation_messages table
create table if not exists public.conversation_messages (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  role text not null,
  content text not null,
  message_type text not null,
  metadata jsonb null default '{}'::jsonb,
  timestamp timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint conversation_messages_pkey primary key (id),
  constraint conversation_messages_session_id_fkey foreign KEY (session_id) references interactive_course_sessions (id) on delete CASCADE,
  constraint conversation_messages_message_type_check check (
    (
      message_type = any (
        array[
          'explanation'::text,
          'question'::text,
          'assessment'::text,
          'challenge'::text,
          'feedback'::text,
          'encouragement'::text,
          'summary'::text
        ]
      )
    )
  ),
  constraint conversation_messages_role_check check (
    (
      role = any (array['genie'::text, 'learner'::text])
    )
  )
) TABLESPACE pg_default;

-- Indices
create index IF not exists idx_conversation_messages_session_id on public.conversation_messages using btree (session_id) TABLESPACE pg_default;
create index IF not exists idx_conversation_messages_timestamp on public.conversation_messages using btree (session_id, "timestamp") TABLESPACE pg_default;
create index IF not exists idx_conversation_messages_role on public.conversation_messages using btree (role) TABLESPACE pg_default;
create index IF not exists idx_conversation_messages_type on public.conversation_messages using btree (message_type) TABLESPACE pg_default;

-- Trigger to update session timestamp
create or replace function update_session_last_interaction()
returns trigger as $$
begin
  update interactive_course_sessions
  set last_interaction = now()
  where id = new.session_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_update_session_interaction_on_message on conversation_messages;
create trigger tr_update_session_interaction_on_message
after INSERT on conversation_messages for EACH row
execute FUNCTION update_session_last_interaction();

-- RPC: Get Session Conversation (Crucial for frontend)
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
