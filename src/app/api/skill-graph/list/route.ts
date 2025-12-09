import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all skill graphs for this user
        const { data: courses, error: coursesError } = await supabase
            .from('skill_graphs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (coursesError) {
            throw new Error('Failed to fetch courses');
        }

        // Fetch progress for all courses
        const { data: progressRecords } = await supabase
            .from('user_progress')
            .select('skill_graph_id, mastery_level')
            .eq('user_id', user.id);

        // Calculate average progress per course
        const progressMap: Record<string, number> = {};

        courses?.forEach(course => {
            const courseProgress = progressRecords?.filter(p => p.skill_graph_id === course.id) || [];
            if (courseProgress.length > 0) {
                const avgMastery = courseProgress.reduce((sum, p) => sum + p.mastery_level, 0) / courseProgress.length;
                progressMap[course.id] = avgMastery;
            } else {
                progressMap[course.id] = 0;
            }
        });

        return NextResponse.json({
            success: true,
            courses: courses || [],
            progress: progressMap,
        });

    } catch (error: any) {
        console.error('Courses List Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}
