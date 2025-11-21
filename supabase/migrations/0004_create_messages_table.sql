-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    circle_id BIGINT REFERENCES study_circles(id) ON DELETE CASCADE,
    -- Add a username column to display who sent the message
    username TEXT NOT NULL
);

-- Enable Real-Time on the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Function to get messages for a specific circle
CREATE OR REPLACE FUNCTION get_messages_for_circle(p_circle_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    created_at TIMESTAMPTZ,
    content TEXT,
    user_id UUID,
    circle_id BIGINT,
    username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM messages
    WHERE messages.circle_id = p_circle_id
    ORDER BY messages.created_at ASC;
END;
$$ LANGUAGE plpgsql;
