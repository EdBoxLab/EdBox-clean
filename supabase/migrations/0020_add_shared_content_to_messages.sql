-- Add shared_content column to messages table for study circle sharing
ALTER TABLE messages ADD COLUMN IF NOT EXISTS shared_content JSONB;

-- Add shared_content column to direct_messages table for direct message sharing
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS shared_content JSONB;

-- Create indexes for shared content queries
CREATE INDEX IF NOT EXISTS idx_messages_shared_content ON messages USING GIN (shared_content);
CREATE INDEX IF NOT EXISTS idx_direct_messages_shared_content ON direct_messages USING GIN (shared_content);

-- Update the get_messages_for_circle function to include shared_content
CREATE OR REPLACE FUNCTION get_messages_for_circle(p_circle_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    created_at TIMESTAMPTZ,
    content TEXT,
    user_id UUID,
    circle_id BIGINT,
    username TEXT,
    shared_content JSONB
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        messages.id,
        messages.created_at,
        messages.content,
        messages.user_id,
        messages.circle_id,
        messages.username,
        messages.shared_content
    FROM messages
    WHERE messages.circle_id = p_circle_id
    ORDER BY messages.created_at ASC;
END;
$ LANGUAGE plpgsql;