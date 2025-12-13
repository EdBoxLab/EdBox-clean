import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 🔍 DEBUG: Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 Auth user:', user?.id, user?.email);
    console.log('🔍 Auth error:', userError);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: 'No user found in session' 
      }, { status: 401 });
    }

    // 🔍 DEBUG: Check admin table
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('🔍 Admin record:', adminRecord);
    console.log('🔍 Admin error:', adminError);
    
    if (adminError) {
      console.error('❌ Admin table error:', adminError);
      return NextResponse.json({ 
        error: 'Database error',
        details: adminError.message,
        code: adminError.code
      }, { status: 500 });
    }
    
    if (!adminRecord) {
      return NextResponse.json({ 
        error: 'Not found in admins table',
        details: `User ${user.id} is not an admin`,
        debug: { 
          userId: user.id,
          checkedTable: 'admins',
          found: false 
        }
      }, { status: 403 });
    }
    
    if (!adminRecord.is_active) {
      return NextResponse.json({ 
        error: 'Admin account not active',
        details: 'Your admin account has been deactivated',
        debug: { isActive: adminRecord.is_active }
      }, { status: 403 });
    }

    console.log('✅ Admin authenticated successfully');

    // ✅ If we got here, you're authenticated and an admin!
    // Now continue with your ORIGINAL code:
    
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, country, education, age, onboarding_completed')
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
      throw profilesError;
    }

    const userIds = profiles?.map(p => p.id) || [];

    let usageData: any[] = [];
    let subscriptionData: any[] = [];

    // Only query usage/subscriptions if we have IDs
    if (userIds.length > 0) {
      const { data: usage, error: usageError } = await supabase
        .from('user_usage')
        .select('*')
        .in('user_id', userIds);
      if (usageError) {
        console.error('❌ Usage error:', usageError);
        throw usageError;
      }
      usageData = usage || [];

      const { data: subs, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .in('user_id', userIds);
      if (subsError) {
        console.error('❌ Subscriptions error:', subsError);
        throw subsError;
      }
      subscriptionData = subs || [];
    }

    // Combine data
    const users = profiles?.map(profile => {
      const usage = usageData.find(u => u.user_id === profile.id);
      const subscription = subscriptionData.find(s => s.user_id === profile.id);

      return {
        id: profile.id,
        role: profile.role || 'user',
        country: profile.country,
        education: profile.education,
        age: profile.age,
        onboardingCompleted: profile.onboarding_completed,
        usage: {
          coursesCreated: usage?.courses_created_month || 0,
          studyKitsCreated: usage?.study_kits_created_week || 0,
          researchQueries: usage?.research_queries_week || 0,
        },
        subscription: {
          plan: subscription?.plan_id || 'free',
          status: subscription?.status || 'active',
        },
      };
    });

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('❌ Admin users GET error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    // Update user role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user role',
      details: error.message 
    }, { status: 500 });
  }
}