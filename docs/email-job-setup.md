# Daily Streak Reminder Email Job - Setup Guide

## Overview

This guide walks you through setting up the GitHub Actions workflow that sends daily streak reminder emails to users at 10:00 AM in their local time zone.

## What This Does

- Runs every hour via GitHub Actions CRON
- Fetches users with active streaks from Supabase
- Filters users based on their timezone (sends at 10:00 AM their local time)
- Sends personalized streak reminder emails via Resend API
- Includes batch processing, retry logic, and error handling

## Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Supabase Database**: With `profiles_with_streaks` view and `timezone` column
3. **Resend Account**: For sending emails
4. **GitHub Secrets**: Configure the required secrets (see below)

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. SUPABASE_URL
Your Supabase project URL.
- Where to find: Supabase Dashboard → Settings → API → Project URL
- Example: `https://your-project.supabase.co`

### 2. SUPABASE_SERVICE_ROLE_KEY
Your Supabase service role key (full database access).
- Where to find: Supabase Dashboard → Settings → API → service_role (secret)
- ⚠️ **Important**: Use the `service_role` key, NOT the `anon` key
- This key has full database access and bypasses RLS policies

### 3.RESEND_API_KEY
Your Resend API key for sending emails.
- Where to find: Resend Dashboard → API Keys → Create API Key
- Example: `re_xxxxxxxxxxxxxx`

## How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. Repeat for all three secrets

## Database Requirements

### Required Tables/Views

#### 1. `profiles_with_streaks` View
This view should include:
- `id` - User ID
- `email` - User's email address
- `full_name` - User's full name
- `timezone` - User's timezone (e.g., 'Africa/Lagos', 'America/New_York')
- `current_streak` - Current streak count
- `longest_streak` - Longest streak achieved
- `last_activity_date` - Last activity date
- `opt_out_emails` - Boolean flag for email opt-out

#### 2. `timezone` Column
The `profiles` table must have a `timezone` column with IANA timezone strings.
Examples:
- `Africa/Lagos`
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`

## Configuration Options

The workflow uses these environment variables (configured in `.github/workflows/daily-streak-reminder.yml`):

```yaml
SEND_HOUR_LOCAL: '10'        # Target hour in user's local time (10 AM)
BATCH_SIZE: '100'            # Emails per batch
BATCH_DELAY_MS: '2000'       # Delay between batches (2 seconds)
```

To change these values, edit the workflow file directly.

## How It Works

### 1. CRON Schedule
The workflow runs every hour: `0 * * * *`
- This ensures users in different time zones receive emails at their 10:00 AM
- Example: A user in Lagos (UTC+1) gets email at 9:00 UTC
- Example: A user in New York (UTC-5) gets email at 15:00 UTC

### 2. Timezone Filtering
For each user, the script:
1. Gets the user's timezone from the database
2. Calculates the current time in that timezone
3. Checks if it's 10:00 AM in that timezone
4. Only sends email if it matches

### 3. Batch Processing
- Emails are sent in batches of 100
- 2-second delay between batches to avoid rate limiting
- Automatic retry with exponential backoff on failures

### 4. Email Content
Emails are personalized based on streak length:
- **30+ days**: "Your legendary streak is at stake!"
- **7-29 days**: "Your streak is on the line!"
- **1-6 days**: "You have a streak going!"

## Testing

### Local Testing

1. Set up environment variables locally:
```bash
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export RESEND_API_KEY="your_resend_api_key"
```

2. Run the script:
```bash
npx tsx scripts/send-streak-reminders.ts
```

Or compile and run:
```bash
npx tsc scripts/send-streak-reminders.ts --outDir dist --module commonjs --target es2020 --moduleResolution node --esModuleInterop
node dist/send-streak-reminders.js
```

### Manual Trigger in GitHub

1. Go to **Actions** tab in your repository
2. Select **Daily Streak Reminder Emails** workflow
3. Click **Run workflow** → **Run workflow**

### Dry Run Testing

To test without sending emails, you can temporarily modify the script to log instead of send, or use a test Resend API key.

## Monitoring

### GitHub Actions Logs
- Go to **Actions** tab
- Click on a workflow run
- View detailed logs for each step

### Resend Dashboard
- Monitor email delivery status
- View bounce and complaint rates
- Check API usage

### Supabase Logs
- Monitor database query performance
- Check for any connection issues

## Troubleshooting

### Workflow Not Running
- Check if GitHub Actions is enabled in repository settings
- Verify the CRON syntax is correct
- Check if the workflow file is in `.github/workflows/` directory

### No Emails Sent
- Verify all GitHub secrets are set correctly
- Check if users have valid timezones in the database
- Verify users have `opt_out_emails = false`
- Check if users have active streaks (`current_streak >= 1`)
- Review workflow logs for errors

### Rate Limiting Errors
- Increase `BATCH_DELAY_MS` in the workflow
- Reduce `BATCH_SIZE` if needed
- Check Resend API rate limits

### Timezone Issues
- Verify timezone format is correct (IANA format)
- Check if timezone column exists in profiles table
- Test timezone conversion with sample data

## Security Best Practices

1. **Never commit secrets**: Always use GitHub Secrets
2. **Use service role key**: Required for database access, but keep it secret
3. **Limit API key permissions**: Only grant necessary permissions
4. **Rotate keys regularly**: Update secrets periodically
5. **Monitor usage**: Check for unusual activity

## Cost Considerations

### GitHub Actions
- Free for public repositories
- 2,000 free minutes/month for private repositories
- This workflow typically runs for 1-5 minutes per execution

### Resend
- Free tier: 3,000 emails/month
- Paid plans available for higher volumes
- Check [Resend pricing](https://resend.com/pricing)

### Supabase
- Free tier includes generous database usage
- Monitor database query performance
- Consider caching if needed

## Future Enhancements

1. **Email Logs Table**: Create a table to track sent emails and prevent duplicates
2. **Slack Notifications**: Get notified when emails are sent
3. **A/B Testing**: Test different email templates
4. **Analytics**: Track email open rates and click-through rates
5. **Customizable Times**: Allow users to choose their preferred email time

## Support

For issues or questions:
1. Check the workflow logs in GitHub Actions
2. Review the Resend dashboard for email delivery issues
3. Check Supabase logs for database errors
4. Refer to the implementation plan: `plans/github-actions-streak-reminder.md`

## Files Created

- `scripts/send-streak-reminders.ts` - Main email sending script
- `.github/workflows/daily-streak-reminder.yml` - GitHub Actions workflow
- `plans/github-actions-streak-reminder.md` - Implementation plan
- `docs/email-job-setup.md` - This setup guide
