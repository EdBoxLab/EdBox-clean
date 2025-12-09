import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const { stats } = await request.json();

        if (!stats) {
            return NextResponse.json(
                { error: 'Stats data is required' },
                { status: 400 }
            );
        }

        // Build context for AI analysis
        const statsContext = `
Platform Statistics Analysis Request:

**User Metrics:**
- Total Users: ${stats.users?.total || 0}
- Admin Users: ${stats.users?.admins || 0}
- New Users (Last 7 Days): ${stats.users?.newLast7Days || 0}
- Active Users (Last 7 Days): ${stats.users?.activeLast7Days || 0}

**Content Metrics:**
- Total Notes: ${stats.content?.notes || 0}
- Chat Conversations: ${stats.content?.conversations || 0}
- Chat Messages: ${stats.content?.messages || 0}
- Study Kits Created: ${stats.content?.studyKits || 0}

**Activity (Last 24h):**
- Messages Created: ${stats.activity?.messagesLast24h || 0}
- Notes Created: ${stats.activity?.notesLast24h || 0}

**Subscription Breakdown:**
- Active Subscriptions: ${stats.subscriptions?.active || 0}
- Plan Distribution: ${JSON.stringify(stats.subscriptions?.planBreakdown || {})}

Please provide:
1. **Key Insights**: What do these metrics tell us about platform health and user engagement?
2. **Power Users**: Identify characteristics of highly engaged users based on the data.
3. **User Behavior Patterns**: What patterns emerge from the activity data?
4. **Areas of Improvement**: What should we focus on to improve user engagement and retention?
5. **Actionable Recommendations**: Specific steps to enhance the platform.

Format your response in clear markdown with sections.
    `;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert data analyst and product manager specializing in educational technology platforms. Provide insightful, actionable analysis based on platform metrics.',
                },
                {
                    role: 'user',
                    content: statsContext,
                },
            ],
            model: 'llama3-70b-8192',
            temperature: 0.8,
            max_tokens: 2000,
        });

        const analysis = completion.choices[0]?.message?.content || 'Unable to generate analysis.';

        return NextResponse.json({
            analysis,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Admin analysis error:', error);

        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Failed to generate analysis' },
            { status: 500 }
        );
    }
}
