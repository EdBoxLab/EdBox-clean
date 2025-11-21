-- Function to get the top users by XP
CREATE OR REPLACE FUNCTION get_top_users(limit_count INT)
RETURNS TABLE (
    rank BIGINT,
    username TEXT,
    avatar_url TEXT,
    xp INT,
    streak INT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        RANK() OVER (ORDER BY p.xp DESC) as rank,
        p.username,
        p.avatar_url,
        p.xp,
        p.streak,
        p.id as user_id
    FROM
        user_profiles p
    ORDER BY
        p.xp DESC
    LIMIT
        limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get the top study circles by total member XP
CREATE OR REPLACE FUNCTION get_top_circles(limit_count INT)
RETURNS TABLE (
    rank BIGINT,
    name TEXT,
    total_xp BIGINT,
    circle_id BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH circle_xp AS (
        SELECT
            cm.circle_id,
            SUM(up.xp) as total_xp
        FROM
            circle_members cm
        JOIN
            user_profiles up ON cm.user_id = up.id
        GROUP BY
            cm.circle_id
    )
    SELECT
        RANK() OVER (ORDER BY cx.total_xp DESC) as rank,
        sc.name,
        cx.total_xp,
        sc.id as circle_id
    FROM
        circle_xp cx
    JOIN
        study_circles sc ON cx.circle_id = sc.id
    ORDER BY
        cx.total_xp DESC
    LIMIT
        limit_count;
END;
$$ LANGUAGE plpgsql;
