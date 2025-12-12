import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, contentId, circleId, recipientUserId, message } = body;

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Content type and ID are required' }, { status: 400 });
    }

    if (!circleId && !recipientUserId) {
      return NextResponse.json({ error: 'Must specify either circle or recipient' }, { status: 400 });
    }

    const validTypes = ['course', 'study_kit', 'note'];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    let contentData: any = null;

    if (contentType === 'course') {
      const { data } = await supabase
        .from('skill_graphs')
        .select('*')
        .eq('id', contentId)
        .eq('user_id', user.id)
        .single();
      contentData = data;
    } else if (contentType === 'study_kit') {
      const { data } = await supabase
        .from('study_kit_content')
        .select('*')
        .eq('id', contentId)
        .eq('user_id', user.id)
        .single();
      contentData = data;
    } else if (contentType === 'note') {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('id', contentId)
        .eq('user_id', user.id)
        .single();
      contentData = data;
    }

    if (!contentData) {
      return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 });
    }

    const { data: sharedContent, error: shareError } = await supabase
      .from('shared_content')
      .insert({
        content_type: contentType,
        content_id: contentId,
        shared_by: user.id,
        circle_id: circleId || null,
        recipient_user_id: recipientUserId || null,
        message: message || null,
      })
      .select()
      .single();

    if (shareError) throw shareError;

    if (contentType === 'course' && recipientUserId) {
      await personalizeAndSaveCourse(contentId, recipientUserId, sharedContent.id, contentData);
    }

    return NextResponse.json({ success: true, sharedContent });
  } catch (error: any) {
    console.error('Share Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to share content' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const circleId = searchParams.get('circleId');
    const forUser = searchParams.get('forUser') === 'true';

    let query = supabase
      .from('shared_content')
      .select(`
        *,
        shared_by_profile:shared_by(id),
        circle:study_circles(id, name)
      `)
      .order('created_at', { ascending: false });

    if (forUser) {
      query = query.or(`recipient_user_id.eq.${user.id},circle_id.in.(SELECT id FROM study_circle_members WHERE user_id = '${user.id}')`);
    } else if (circleId) {
      query = query.eq('circle_id', circleId);
    } else {
      query = query.eq('shared_by', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sharedContent: data });
  } catch (error: any) {
    console.error('Get Shared Content Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch shared content' }, { status: 500 });
  }
}

async function personalizeAndSaveCourse(
  originalCourseId: string,
  userId: string,
  sharedContentId: string,
  originalCourse: any
) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const systemPrompt = `You are an expert curriculum personalization AI. 
You will receive a course structure (skill graph) and a user profile.
Your task is to adapt the course content to match the user's:
- Education level
- Age
- Country/culture
- Interests

CRITICAL RULES:
1. Keep the same course structure (skill paths, skills, projects)
2. Personalize: skill names, descriptions, examples, challenge types
3. Make content culturally relevant and age-appropriate
4. Adjust difficulty based on education level
5. Return ONLY valid JSON matching the original structure

User Profile:
- Education: ${recipientProfile?.education || 'General'}
- Age: ${recipientProfile?.age || 'Unknown'}
- Country: ${recipientProfile?.country || 'Global'}
- Interests: ${recipientProfile?.interests?.join(', ') || 'None'}

Original Course:
${JSON.stringify(originalCourse, null, 2)}

Personalize this course for the user and return the complete personalized JSON.`;

    const result = await generateWithRetry({
      prompt: systemPrompt,
      systemPrompt: '',
      schema: {},
      temperature: 0.8,
      maxTokens: 8000,
    });

    const personalizedData = JSON.parse(result.text);

    await supabase
      .from('personalized_courses')
      .upsert({
        original_course_id: originalCourseId,
        user_id: userId,
        personalized_data: personalizedData,
        shared_content_id: sharedContentId,
      }, {
        onConflict: 'original_course_id,user_id'
      });

    console.log(`✅ Personalized course for user ${userId}`);
  } catch (error) {
    console.error('Course Personalization Error:', error);
  }
}
