import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPostHogClient } from '@/lib/posthog-server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { skillGraphId } = await request.json();

        if (!skillGraphId) {
            return NextResponse.json({ error: 'Skill graph ID required' }, { status: 400 });
        }

        // Fetch competency data
        const competencyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competency/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillGraphId }),
        });

        const competencyData = await competencyResponse.json();

        if (!competencyData.success || !competencyData.summary.eligibleForCertificate) {
            return NextResponse.json({
                error: 'Not eligible for certificate. Complete at least 80% of skills with mastery.',
            }, { status: 400 });
        }

        // Fetch skill graph details
        const { data: graph } = await supabase
            .from('skill_graphs')
            .select('*')
            .eq('id', skillGraphId)
            .eq('user_id', user.id)
            .single();

        if (!graph) {
            return NextResponse.json({ error: 'Skill graph not found' }, { status: 404 });
        }

        // Fetch user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Generate certificate
        const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const certificate = {
            id: certificateId,
            userId: user.id,
            userName: profile?.full_name || user.email || 'Learner',
            skillGraphId,
            courseName: graph.goal,
            masteredSkills: competencyData.summary.masteredSkills,
            totalSkills: competencyData.summary.totalSkills,
            overallMastery: competencyData.summary.overallMastery,
            issuedAt: new Date().toISOString(),
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certificateId}`,
        };

        // Save certificate to database
        const { error } = await supabase
            .from('certificates')
            .insert({
                id: certificateId,
                user_id: user.id,
                skill_graph_id: skillGraphId,
                certificate_data: certificate,
                issued_at: certificate.issuedAt,
            });

        if (error) {
            throw new Error('Failed to save certificate');
        }

        // Track certificate generated event (server-side)
        const posthog = getPostHogClient();
        posthog.capture({
            distinctId: user.id,
            event: 'certificate_generated',
            properties: {
                certificate_id: certificateId,
                skill_graph_id: skillGraphId,
                course_name: graph.goal,
                mastered_skills: competencyData.summary.masteredSkills,
                total_skills: competencyData.summary.totalSkills,
                overall_mastery: competencyData.summary.overallMastery,
            },
        });

        return NextResponse.json({
            success: true,
            certificate,
        });

    } catch (error: any) {
        console.error('Certificate Generation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate certificate' },
            { status: 500 }
        );
    }
}
