-- Function to get all study circles with their member count
CREATE OR REPLACE FUNCTION get_circles_with_member_count()
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    creator_id UUID,
    created_at TIMESTAMPTZ,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.name,
        sc.description,
        sc.creator_id,
        sc.created_at,
        COUNT(cm.user_id) as member_count
    FROM
        study_circles sc
    LEFT JOIN
        circle_members cm ON sc.id = cm.circle_id
    GROUP BY
        sc.id;
END;
$$ LANGUAGE plpgsql;
