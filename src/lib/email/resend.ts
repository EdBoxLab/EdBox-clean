// src/lib/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendStudyCircleNotification(
  to: string,
  userName: string,
  circleName: string,
  messageCount: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'EdBox <hello@edbox.app>',
      to: to,
      subject: `${messageCount} new messages in ${circleName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Hey ${userName}!</h2>
          <p style="font-size: 16px; color: #374151;">
            Your study circle <strong>${circleName}</strong> has ${messageCount} new messages.
          </p>
          <a 
            href="https://edbox.app/socials/study-circles" 
            style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;"
          >
            View Messages →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
            EdBox - Learning That Actually Works<br>
            <a href="https://edbox.app/settings/notifications" style="color: #8B5CF6;">Manage notifications</a>
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Study circle email sent:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return { success: false, error: err };
  }
}

export async function sendReengagementEmail(
  to: string,
  userName: string,
  daysSinceLastActive: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Inioluwa at EdBox <ini@edbox.app>',
      to: to,
      subject: 'Your learning streak is waiting',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Hey ${userName},</h2>
          <p style="font-size: 16px; color: #374151;">
            It's been ${daysSinceLastActive} days since your last session.
          </p>
          <p style="font-size: 16px; color: #374151;">
            Your progress is still saved. Pick up where you left off:
          </p>
          <ul style="font-size: 16px; color: #374151;">
            <li>Skills ready to master</li>
            <li>Challenges unlocked</li>
            <li>Your streak can restart today</li>
          </ul>
          <a 
            href="https://edbox.app/dashboard" 
            style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;"
          >
            Continue Learning →
          </a>
          <p style="color: #374151; margin-top: 30px;">
            — Inioluwa<br>
            <span style="color: #9ca3af;">Founder, EdBox</span>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
            <a href="https://edbox.app/unsubscribe" style="color: #8B5CF6;">Unsubscribe</a>
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Re-engagement email sent:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return { success: false, error: err };
  }
}

export async function sendSkillMasteryEmail(
  to: string,
  userName: string,
  skillName: string,
  xpEarned: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'EdBox <hello@edbox.app>',
      to: to,
      subject: `🏆 You mastered ${skillName}!`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🏆 Congrats ${userName}!</h2>
          <p style="font-size: 18px; color: #374151;">
            You just mastered <strong>${skillName}</strong>
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-transform: uppercase;">XP Gained</p>
            <p style="margin: 0; color: #8B5CF6; font-size: 32px; font-weight: bold;">+${xpEarned}</p>
          </div>
          <a 
            href="https://edbox.app/dashboard" 
            style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;"
          >
            Continue Learning →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
            EdBox - Learning That Actually Works
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Skill mastery email sent:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return { success: false, error: err };
  }
}

export async function sendWeeklyProgressEmail(
  to: string,
  userName: string,
  stats: {
    skillsMastered: number;
    xpEarned: number;
    challengesCompleted: number;
    streakDays: number;
  }
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'EdBox <hello@edbox.app>',
      to: to,
      subject: `This week: ${stats.skillsMastered} skills mastered 🔥`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Hey ${userName}!</h2>
          <p style="font-size: 16px; color: #374151;">
            Here's what you accomplished this week:
          </p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">🏆 Skills Mastered</p>
                <p style="margin: 0; color: #8B5CF6; font-size: 28px; font-weight: bold;">${stats.skillsMastered}</p>
              </div>
              <div>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">⚡ XP Earned</p>
                <p style="margin: 0; color: #8B5CF6; font-size: 28px; font-weight: bold;">${stats.xpEarned}</p>
              </div>
              <div>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">🎯 Challenges Done</p>
                <p style="margin: 0; color: #8B5CF6; font-size: 28px; font-weight: bold;">${stats.challengesCompleted}</p>
              </div>
              <div>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">🔥 Current Streak</p>
                <p style="margin: 0; color: #8B5CF6; font-size: 28px; font-weight: bold;">${stats.streakDays}</p>
              </div>
            </div>
          </div>
          <p style="font-size: 16px; color: #374151;">
            Keep going. You're crushing it. 💪
          </p>
          <a 
            href="https://edbox.app/dashboard" 
            style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;"
          >
            Continue Learning →
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
            EdBox - Learning That Actually Works<br>
            <a href="https://edbox.app/settings/notifications" style="color: #8B5CF6;">Manage notifications</a>
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error };
    }

    console.log('✅ Weekly progress email sent:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return { success: false, error: err };
  }
}
