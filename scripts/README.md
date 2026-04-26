# Email Scripts

This directory contains scripts for sending automated emails.

## send-streak-reminders.ts

Sends daily streak reminder emails to users at 10:00 AM in their local time zone.

### Usage

**Run directly:**
```bash
npx tsx scripts/send-streak-reminders.ts
```

**Compile and run:**
```bash
npx tsc scripts/send-streak-reminders.ts --outDir dist --module commonjs --target es2020 --moduleResolution node --esModuleInterop
node dist/send-streak-reminders.js
```

### Environment Variables

Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `RESEND_API_KEY` - Your Resend API key

Optional:
- `SEND_HOUR_LOCAL` - Target hour in user's local time (default: 10)
- `BATCH_SIZE` - Emails per batch (default: 100)
- `BATCH_DELAY_MS` - Delay between batches in ms (default: 2000)
- `MAX_RETRIES` - Retry attempts (default: 3)

### How It Works

1. Fetches users with active streaks from Supabase
2. Filters users based on their timezone (sends at 10:00 AM their local time)
3. Sends personalized streak reminder emails via Resend API
4. Includes batch processing, retry logic, and error handling

### GitHub Actions

This script is automatically run every hour via GitHub Actions. See `.github/workflows/daily-streak-reminder.yml` for the workflow configuration.

### Documentation

For detailed setup instructions, see [`docs/email-job-setup.md`](../docs/email-job-setup.md).

## Exam Demo Seeder

### Files

- `scripts/exam-demo.insurance-us.json` - Sample investor-demo dataset for the exam engine
- `scripts/import-exam-demo.js` - Imports exam config, domains, materials, and questions into Supabase

### Usage

```bash
node scripts/import-exam-demo.js scripts/exam-demo.insurance-us.json --reset
```

### Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Demo Flow

0. Apply exam schema migration in Supabase SQL editor:
	- `supabase/migrations/20260426000000_exam_engine.sql`
1. Run the importer command
2. Open `/exam` or `/exams/insurance-us`
3. Go to study map and open quiz shell
4. Submit answers to create real attempt records
