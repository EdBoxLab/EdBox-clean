-- Function to get details for a single study circle
CREATE OR REPLACE FUNCTION get_circle_details(p_circle_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    created_by_user_id UUID,
    creator_username TEXT,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.name,
        sc.description,
        sc.created_by_user_id,
        up.username as creator_username,
        (SELECT COUNT(*) FROM circle_members cm WHERE cm.circle_id = sc.id) as member_count
    FROM
        study_circles sc
    LEFT JOIN
        user_profiles up ON sc.created_by_user_id = up.id
    WHERE
        sc.id = p_circle_id;
END;
$$ LANGUAGE plpgsql;

-- We also need a way to get the members of a circle
CREATE OR REPLACE FUNCTION get_circle_members(p_circle_id BIGINT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as user_id,
        p.username,
        p.avatar_url,
        cm.created_at as joined_at
    FROM
        circle_members cm
    JOIN
        user_profiles p ON cm.user_id = p.id
    WHERE
        cm.circle_id = p_circle_id
    ORDER BY
        cm.created_at ASC;
END;
$$ LANGUAGE plpgsql;
