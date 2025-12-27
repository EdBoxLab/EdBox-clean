import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const XP_CONFIG = {
  DAILY_LOGIN: 10,
  STREAK_BONUS_PER_DAY: 5,
  LESSON_COMPLETE: 25,
  QUIZ_COMPLETE: 50,
  COURSE_COMPLETE: 100,
  STREAK_MILESTONE_7: 50,
  STREAK_MILESTONE_30: 200,
  STREAK_MILESTONE_100: 500,
};

function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

function xpForNextLevel(level: number): number {
  return level * level * 100;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: xpData } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: recentTransactions } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const totalXp = xpData?.total_xp || 0;
    const level = xpData?.level || calculateLevel(totalXp);
    const currentStreak = streakData?.current_streak || 0;
    const longestStreak = streakData?.longest_streak || 0;

    return NextResponse.json({
      streak: {
        current: currentStreak,
        longest: longestStreak,
        lastActivityDate: streakData?.last_activity_date,
        streakStartedAt: streakData?.streak_started_at,
      },
      xp: {
        total: totalXp,
        level,
        xpForCurrentLevel: xpForNextLevel(level - 1),
        xpForNextLevel: xpForNextLevel(level),
        progress: totalXp - xpForNextLevel(level - 1),
      },
      recentTransactions: recentTransactions || [],
    });
  } catch (error: unknown) {
    console.error('Streaks GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    const today = new Date().toISOString().split('T')[0];

    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: xpData } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let currentStreak = streakData?.current_streak || 0;
    let longestStreak = streakData?.longest_streak || 0;
    let lastActivityDate = streakData?.last_activity_date;
    let streakStartedAt = streakData?.streak_started_at;
    let xpGained = 0;
    const xpBreakdown: { type: string; amount: number }[] = [];

    if (action === 'check_in' || action === 'daily_login') {
      if (lastActivityDate === today) {
        return NextResponse.json({
          message: 'Already checked in today',
          streak: { current: currentStreak, longest: longestStreak },
          xp: { total: xpData?.total_xp || 0, gained: 0 },
          alreadyCheckedIn: true,
        });
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivityDate === yesterdayStr) {
        currentStreak += 1;
      } else if (!lastActivityDate || lastActivityDate < yesterdayStr) {
        currentStreak = 1;
        streakStartedAt = today;
      }

      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      xpGained += XP_CONFIG.DAILY_LOGIN;
      xpBreakdown.push({ type: 'Daily Login', amount: XP_CONFIG.DAILY_LOGIN });

      const streakBonus = Math.min(currentStreak, 30) * XP_CONFIG.STREAK_BONUS_PER_DAY;
      xpGained += streakBonus;
      xpBreakdown.push({ type: `${currentStreak}-Day Streak Bonus`, amount: streakBonus });

      if (currentStreak === 7) {
        xpGained += XP_CONFIG.STREAK_MILESTONE_7;
        xpBreakdown.push({ type: '7-Day Streak Milestone', amount: XP_CONFIG.STREAK_MILESTONE_7 });
      } else if (currentStreak === 30) {
        xpGained += XP_CONFIG.STREAK_MILESTONE_30;
        xpBreakdown.push({ type: '30-Day Streak Milestone', amount: XP_CONFIG.STREAK_MILESTONE_30 });
      } else if (currentStreak === 100) {
        xpGained += XP_CONFIG.STREAK_MILESTONE_100;
        xpBreakdown.push({ type: '100-Day Streak Milestone', amount: XP_CONFIG.STREAK_MILESTONE_100 });
      }

      lastActivityDate = today;
    } else if (action === 'lesson_complete') {
      xpGained = XP_CONFIG.LESSON_COMPLETE;
      xpBreakdown.push({ type: 'Lesson Complete', amount: XP_CONFIG.LESSON_COMPLETE });
    } else if (action === 'quiz_complete') {
      xpGained = XP_CONFIG.QUIZ_COMPLETE;
      xpBreakdown.push({ type: 'Quiz Complete', amount: XP_CONFIG.QUIZ_COMPLETE });
    } else if (action === 'course_complete') {
      xpGained = XP_CONFIG.COURSE_COMPLETE;
      xpBreakdown.push({ type: 'Course Complete', amount: XP_CONFIG.COURSE_COMPLETE });
    }

    await supabase
      .from('user_streaks')
      .upsert({
        user_id: user.id,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate,
        streak_started_at: streakStartedAt || today,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    const newTotalXp = (xpData?.total_xp || 0) + xpGained;
    const newLevel = calculateLevel(newTotalXp);
    const previousLevel = xpData?.level || 1;
    const leveledUp = newLevel > previousLevel;

    await supabase
      .from('user_xp')
      .upsert({
        user_id: user.id,
        total_xp: newTotalXp,
        level: newLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (xpGained > 0) {
      await supabase
        .from('xp_transactions')
        .insert({
          user_id: user.id,
          amount: xpGained,
          action_type: action,
          description: xpBreakdown.map(b => `${b.type}: +${b.amount}`).join(', '),
        });
    }

    return NextResponse.json({
      success: true,
      streak: {
        current: currentStreak,
        longest: longestStreak,
        lastActivityDate,
        streakStartedAt,
      },
      xp: {
        total: newTotalXp,
        gained: xpGained,
        breakdown: xpBreakdown,
        level: newLevel,
        leveledUp,
        xpForNextLevel: xpForNextLevel(newLevel),
      },
    });
  } catch (error: unknown) {
    console.error('Streaks POST Error:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}
