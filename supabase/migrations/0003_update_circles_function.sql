-- Function to get all study circles with member count and membership status for a given user
CREATE OR REPLACE FUNCTION get_circles_with_details(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    creator_id UUID,
    created_at TIMESTAMPTZ,
    member_count BIGINT,
    is_member BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.name,
        sc.description,
        sc.creator_id,
        sc.created_at,
        COUNT(cm.user_id) as member_count,
        EXISTS(
            SELECT 1
            FROM circle_members cm2
            WHERE cm2.circle_id = sc.id AND cm2.user_id = p_user_id
        ) as is_member
    FROM
        study_circles sc
    LEFT JOIN
        circle_members cm ON sc.id = cm.circle_id
    GROUP BY
        sc.id
    ORDER BY
        sc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Drop the old function
DROP FUNCTION IF EXISTS get_circles_with_member_count();
