# PR: Migrate Streak Reminder Emails from Supabase to GitHub Actions

## Summary

Migrated the daily streak reminder email system from unreliable Supabase Edge Functions to GitHub Actions for reliable, timezone-aware daily execution. This change ensures emails are sent consistently at 10:00 AM in each user's local time zone.

## Problem

The previous implementation used Supabase Edge Functions (Deno) with CRON scheduling, which was unreliable and frequently failed to run daily. This resulted in users not receiving their streak reminder emails, potentially breaking their learning habits.

## Solution

Implemented a GitHub Actions workflow that:
- Runs every hour to catch users in different time zones at their 10:00 AM
- Uses the existing project dependencies (no new dependencies required)
- Sends personalized streak reminder emails via Resend API
- Includes robust error handling, retry logic, and batch processing

## Changes Made

### 1. New Files Created

#### `scripts/send-streak-reminders.ts`
- Converted the Deno script to Node.js/TypeScript
- Uses existing `@supabase/supabase-js` and `resend` dependencies
- **Key Changes from Original:**
  - Timezone-aware filtering: Sends emails at 10:00 AM in each user's local time
  - Removed `email_logs` table check (table doesn't exist in database)
  - Uses `process.env` instead of `Deno.env`
  - Direct execution instead of `Deno.serve()`
  - Fixed type safety in email validation function

**Features:**
- Fetches users with active streaks from Supabase
- Filters users based on their timezone
- Validates email addresses
- Personalizes messages based on streak length:
  - 30+ days: "Your legendary streak is at stake!"
  - 7-29 days: "Your streak is on the line!"
  - 1-6 days: "You have a streak going!"
- Batch processing (100 emails per batch)
- Retry logic with exponential backoff (max 3 retries)
- 2-second delay between batches to avoid rate limiting

#### `.github/workflows/daily-streak-reminder.yml`
- GitHub Actions workflow configuration
- **CRON Schedule:** `0 * * * *` (runs every hour)
- **Manual Trigger:** Can be triggered manually for testing
- **Environment:**
  - Ubuntu latest
  - Node.js 20
  - Uses npm caching for faster builds
- **Steps:**
  1. Checkout repository
  2. Setup Node.js
  3. Install dependencies
  4. Compile TypeScript
  5. Execute email script with environment variables
  6. Upload logs (if any)

#### `docs/email-job-setup.md`
- Comprehensive setup guide
- Required GitHub secrets documentation
- Step-by-step setup instructions
- Testing procedures
- Troubleshooting guide
- Security best practices
- Cost considerations

#### `scripts/README.md`
- Quick reference for email scripts
- Usage examples
- Environment variable documentation

#### `plans/github-actions-streak-reminder.md`
- Implementation plan with architecture diagram
- Component breakdown
- Configuration options
- Testing plan
- Monitoring guidelines
- Rollback plan

### 2. Key Technical Decisions

#### Hourly CRON Schedule
**Decision:** Run every hour instead of once daily

**Rationale:**
- Users are in different time zones
- Need to send emails at 10:00 AM in each user's local time
- Hourly runs ensure all users receive emails at the right time
- Script filters users based on their timezone, so only relevant users get emails each hour

**Example:**
- User in Lagos (UTC+1): Gets email at 9:00 UTC (10:00 AM Lagos time)
- User in New York (UTC-5): Gets email at 15:00 UTC (10:00 AM New York time)
- User in Tokyo (UTC+9): Gets email at 1:00 UTC (10:00 AM Tokyo time)

#### Timezone-Aware Filtering
**Decision:** Filter users based on their local time

**Rationale:**
- Improves user experience by sending emails at optimal time
- Increases email open rates
- Aligns with user's daily routine

**Implementation:**
```typescript
function isTargetHour(timezone: string, targetHour: number): boolean {
  const userTime = getUserLocalTime(timezone);
  return userTime.getHours() === targetHour;
}
```

#### Removed email_logs Check
**Decision:** Removed duplicate prevention via email_logs table

**Rationale:**
- Table doesn't exist in the database
- Hourly filtering naturally prevents duplicates (each user only gets email once per day)
- Can be added later if needed for tracking

#### Batch Processing
**Decision:** Keep batch processing with 100 emails per batch

**Rationale:**
- Avoids API rate limits
- Provides better error isolation
- Allows for partial success handling
- Maintains original implementation's proven approach

### 3. Database Requirements

The script requires the following database structure:

#### `profiles_with_streaks` View
Must include:
- `id` - User ID
- `email` - User's email address
- `full_name` - User's full name
- `timezone` - User's timezone (IANA format, e.g., 'Africa/Lagos')
- `current_streak` - Current streak count
- `longest_streak` - Longest streak achieved
- `last_activity_date` - Last activity date
- `opt_out_emails` - Boolean flag for email opt-out

#### `timezone` Column
The `profiles` table must have a `timezone` column with IANA timezone strings.

## Setup Instructions

### 1. Add GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `SUPABASE_URL` - From Supabase Dashboard → Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard → Settings → API → service_role (secret)
- `RESEND_API_KEY` - From Resend Dashboard → API Keys

### 2. Push to GitHub

Push the code to GitHub to enable the workflow.

### 3. Test Manually

1. Go to Actions tab in GitHub
2. Select "Daily Streak Reminder Emails" workflow
3. Click "Run workflow" → "Run workflow"
4. Monitor the logs to ensure everything works

### 4. Monitor First Runs

- Check GitHub Actions logs for errors
- Monitor Resend dashboard for email delivery
- Verify users are receiving emails at correct times

## Configuration

Environment variables can be adjusted in `.github/workflows/daily-streak-reminder.yml`:

```yaml
SEND_HOUR_LOCAL: '10'        # Target hour in user's local time
BATCH_SIZE: '100'            # Emails per batch
BATCH_DELAY_MS: '2000'       # Delay between batches (2 seconds)
```

## Benefits

### Reliability
- GitHub Actions has proven CRON execution
- Better visibility into execution history
- Automatic retry on failures
- Detailed logging

### Control
- Manual trigger capability for testing
- Easy to disable/enable
- Can adjust schedule without code changes
- Workflow notifications available

### Monitoring
- Built-in workflow status tracking
- Execution history and logs
- Easy to debug issues
- Can integrate with external monitoring tools

### Cost
- Free for public repositories
- 2,000 free minutes/month for private repositories
- Typical execution time: 1-5 minutes per run
- Resend: 3,000 free emails/month

## Testing

### Local Testing

```bash
# Set environment variables
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export RESEND_API_KEY="your_resend_api_key"

# Run the script
npx tsx scripts/send-streak-reminders.ts
```

### Manual Trigger in GitHub

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"

### Dry Run

To test without sending emails, temporarily modify the script to log instead of send, or use a test Resend API key.

## Monitoring

### GitHub Actions
- View workflow runs in Actions tab
- Check logs for errors
- Monitor execution time

### Resend Dashboard
- Monitor email delivery status
- View bounce and complaint rates
- Check API usage

### Supabase
- Monitor database query performance
- Check for connection issues

## Troubleshooting

### Workflow Not Running
- Verify GitHub Actions is enabled
- Check CRON syntax
- Ensure workflow file is in `.github/workflows/` directory

### No Emails Sent
- Verify all GitHub secrets are set correctly
- Check if users have valid timezones
- Verify users have `opt_out_emails = false`
- Check if users have active streaks
- Review workflow logs for errors

### Rate Limiting Errors
- Increase `BATCH_DELAY_MS`
- Reduce `BATCH_SIZE`
- Check Resend API rate limits

### Timezone Issues
- Verify timezone format (IANA format)
- Check if timezone column exists
- Test timezone conversion

## Security Considerations

1. **Never commit secrets** - Always use GitHub Secrets
2. **Use service role key** - Required for database access, but keep it secret
3. **Limit API key permissions** - Only grant necessary permissions
4. **Rotate keys regularly** - Update secrets periodically
5. **Monitor usage** - Check for unusual activity

## Future Enhancements

1. **Email Logs Table** - Create a table to track sent emails
2. **Slack Notifications** - Get notified when emails are sent
3. **A/B Testing** - Test different email templates
4. **Analytics** - Track email open rates and click-through rates
5. **Customizable Times** - Allow users to choose their preferred email time
6. **Retry Failed Emails** - Queue failed emails for retry

## Migration Notes

### What Was Removed
- Supabase Edge Function (Deno script)
- Supabase CRON configuration
- Dependency on Supabase's unreliable scheduling

### What Was Added
- GitHub Actions workflow
- Node.js/TypeScript script
- Timezone-aware filtering
- Comprehensive documentation

### Breaking Changes
None - This is a complete replacement of the email sending system.

## Rollback Plan

If issues occur:
1. Disable workflow in GitHub Actions settings
2. Revert to Supabase Edge Function if needed
3. Check logs for error diagnosis
4. Fix and redeploy

## Related Documentation

- [Setup Guide](docs/email-job-setup.md)
- [Implementation Plan](plans/github-actions-streak-reminder.md)
- [Scripts README](scripts/README.md)

## Checklist

- [x] Created Node.js/TypeScript script
- [x] Created GitHub Actions workflow
- [x] Added timezone-aware filtering
- [x] Removed email_logs check
- [x] Created comprehensive documentation
- [x] Added manual trigger capability
- [x] Included batch processing and retry logic
- [x] Fixed type safety issues
- [x] Created setup guide
- [x] Created troubleshooting guide
- [x] Documented security best practices
- [x] Created PR description

## Questions?

Refer to the [setup guide](docs/email-job-setup.md) for detailed instructions, or check the [implementation plan](plans/github-actions-streak-reminder.md) for technical details.
