import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = 'hello@edbox.app';

// Configuration
const SEND_HOUR_LOCAL = parseInt(process.env.SEND_HOUR_LOCAL || '10');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100');
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '2000');
const MAX_RETRIES = 3;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const resend = new Resend(RESEND_API_KEY);

// Helper function to validate email
function isValidEmail(email: string): boolean {
  return Boolean(email && email.includes('@') && email.length > 3);
}

// Helper function to get user's local time
function getUserLocalTime(timezone: string): Date {
  const now = new Date();
  const userTimeStr = now.toLocaleString('en-US', { timeZone: timezone });
  return new Date(userTimeStr);
}

// Helper function to check if it's the target hour in user's timezone
function isTargetHour(timezone: string, targetHour: number): boolean {
  const userTime = getUserLocalTime(timezone);
  return userTime.getHours() === targetHour;
}

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      // If rate limited (429), wait and retry
      if (error?.status === 429 && i < retries - 1) {
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (i === retries - 1) throw error;
      const waitTime = Math.pow(2, i) * 1000;
      console.log(`Error on attempt ${i + 1}, retrying in ${waitTime}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries exceeded');
}

// Main function
export async function sendStreakReminders() {
  const startTime = Date.now();

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    console.log(`Starting streak reminder job at ${now.toISOString()}`);
    console.log(`Target hour: ${SEND_HOUR_LOCAL} (user's local time)`);

    // Fetch all users with active streaks
    const { data: users, error } = await supabase
      .from('profiles_with_streaks')
      .select('*')
      .eq('opt_out_emails', false)
      .not('email', 'is', null)
      .gte('current_streak', 1)
      .lt('last_activity_date', today)
      .limit(1000);

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('No eligible users found');
      return {
        success: true,
        total_users_found: 0,
        total_sent: 0,
        total_failed: 0,
        total_skipped: 0,
        message: 'No eligible users with active streaks'
      };
    }

    console.log(`Found ${users.length} eligible users`);

    // Filter users based on their local time
    const usersInTargetTimezone = users.filter(user => {
      if (!user.timezone) {
        console.warn(`User ${user.id} has no timezone, skipping`);
        return false;
      }

      const isTargetHourNow = isTargetHour(user.timezone, SEND_HOUR_LOCAL);
      if (!isTargetHourNow) {
        console.log(`User ${user.id} (${user.email}) is not at ${SEND_HOUR_LOCAL}:00 in their timezone (${user.timezone})`);
      }
      return isTargetHourNow;
    });

    console.log(`Filtered to ${usersInTargetTimezone.length} users in target time zone`);

    if (usersInTargetTimezone.length === 0) {
      return {
        success: true,
        total_users_found: users.length,
        total_sent: 0,
        total_failed: 0,
        total_skipped: users.length,
        message: 'No users in target time zone at this hour'
      };
    }

    // Prepare and Validate Email Objects
    const validEmails = [];
    const skippedUsers = [];

    for (const user of usersInTargetTimezone) {
      // Validate email
      if (!isValidEmail(user.email)) {
        console.warn(`Invalid email for user ${user.id}: ${user.email}`);
        skippedUsers.push({ user_id: user.id, reason: 'invalid_email' });
        continue;
      }

      const currentStreak = user.current_streak || 0;
      const longestStreak = user.longest_streak || 0;
      const firstName = user.full_name?.trim().split(' ')[0] || 'there';

      let streakMessage = '';
      let urgency = '';

      if (currentStreak >= 30) {
        streakMessage = `🔥 Your legendary ${currentStreak}-day streak is at stake!`;
        urgency = `You've built something incredible. Don't let it slip away.`;
      } else if (currentStreak >= 7) {
        streakMessage = `🔥 Your ${currentStreak}-day streak is on the line!`;
        urgency = `You're on a roll. Keep the momentum going.`;
      } else {
        streakMessage = `⚡ You have a ${currentStreak}-day streak going!`;
        urgency = `Just one quick session today keeps it alive.`;
      }

      validEmails.push({
        from: FROM_EMAIL,
        to: user.email,
        subject: `${firstName}, your ${currentStreak}-day streak needs you 🔥`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 48px; margin: 0;">🔥</h1>
            </div>
            <h2 style="color: #0F172A; font-size: 24px; margin-bottom: 16px;">Hey ${firstName}!</h2>
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <p style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">${streakMessage}</p>
              <p style="margin: 0; opacity: 0.95; font-size: 16px;">${urgency}</p>
            </div>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              You've logged in <strong>${currentStreak} days in a row</strong>. That's not just a number—it's proof you're building a real learning habit.
            </p>
            ${longestStreak > currentStreak ? `
              <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin: 16px 0; padding: 12px; background: #F1F5F9; border-radius: 8px;">
                💡 Your personal best is ${longestStreak} days. You're ${longestStreak - currentStreak} days away from matching it!
              </p>
            ` : ''}
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://edbox.app/dashboard" style="display: inline-block; background: #3B82F6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Save My Streak →
              </a>
            </div>
            <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              <strong>Why this matters:</strong> Research shows that learning streaks create lasting habits. Missing one day makes it 3x harder to come back tomorrow.
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;">
            <p style="color: #94A3B8; font-size: 13px; text-align: center;">
              These reminders help you stay consistent. <a href="https://edbox.app/settings" style="color: #3B82F6; text-decoration: none;">Adjust your preferences</a>
            </p>
          </div>
        `
      });
    }

    if (validEmails.length === 0) {
      return {
        success: true,
        total_users_found: usersInTargetTimezone.length,
        total_sent: 0,
        total_failed: 0,
        total_skipped: skippedUsers.length,
        message: 'No valid emails after validation'
      };
    }

    console.log(`Prepared ${validEmails.length} valid emails (${skippedUsers.length} skipped)`);

    // Split into Batches
    const emailBatches = [];
    for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
      emailBatches.push(validEmails.slice(i, i + BATCH_SIZE));
    }

    console.log(`Split into ${emailBatches.length} batches of up to ${BATCH_SIZE} emails`);

    // Send Each Batch with Retry Logic
    const batchResults = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < emailBatches.length; i++) {
      const batch = emailBatches[i];
      console.log(`Sending batch ${i + 1}/${emailBatches.length} (${batch.length} emails)`);

      try {
        const result = await retryWithBackoff(() =>
          resend.batch.send(batch)
        );

        console.log(`Batch ${i + 1} sent successfully`);
        totalSent += batch.length;
        batchResults.push({
          batch: i + 1,
          status: 'success',
          count: batch.length,
          data: result
        });

      } catch (err: any) {
        console.error(`Batch ${i + 1} error:`, err);
        totalFailed += batch.length;
        batchResults.push({
          batch: i + 1,
          status: 'error',
          count: batch.length,
          error: String(err)
        });
      }

      // Delay between batches (except after last batch)
      if (i < emailBatches.length - 1) {
        console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Email job completed in ${duration}ms: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      total_users_found: users.length,
      users_in_target_timezone: usersInTargetTimezone.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      total_skipped: skippedUsers.length,
      total_batches: emailBatches.length,
      duration_ms: duration,
      results: batchResults
    };

  } catch (e: any) {
    console.error('Daily reminder error:', e);
    return {
      success: false,
      error: String(e),
      message: e.message
    };
  }
}

// Run if executed directly
if (require.main === module) {
  sendStreakReminders()
    .then(result => {
      console.log('Final result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
