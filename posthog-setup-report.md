# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your EdBox learning platform. This integration enables comprehensive tracking of user behavior across the entire learning journey, from signup to course completion and certificate generation.

## Summary of Changes

The integration adds custom events across multiple files, covering:
- **Authentication tracking**: User signups, logins, and failure events for conversion analysis
- **Learning journey tracking**: Course starts, quiz answers, skill mastery, and challenge completions
- **Social engagement tracking**: Referrals, certificate sharing, and study circle participation
- **Course creation tracking**: Onboarding flow completion and file uploads

All events use environment variables for configuration (already set up in `.env.local`):
- `NEXT_PUBLIC_POSTHOG_KEY`: Your PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog API host (https://us.i.posthog.com)

## Events Table

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `skill_mastered` | User completes and masters a skill/learning objective | `src/components/InteractiveCourseSession.tsx` |
| `quiz_answered` | User answers a quiz question (tracks correct/incorrect) | `src/components/InteractiveCourseSession.tsx` |
| `challenge_completed` | User completes a practical challenge (success/fail) | `src/components/InteractiveCourseSession.tsx` |
| `learning_path_started` | User starts a new learning journey from roadmap | `src/components/InteractiveCourseSession.tsx` |
| `certificate_generated` | User earns a certificate after completing a course | `src/app/api/certificate/generate/route.ts` |
| `certificate_shared` | User shares their earned certificate | `src/components/Certificate.tsx` |
| `referral_link_copied` | User copies their referral link | `src/app/(main)/socials/referrals/page.tsx` |
| `reward_redeemed` | User redeems EdCoins for a reward | `src/app/(main)/socials/referrals/page.tsx` |
| `onboarding_step_completed` | User completes a course creation onboarding step | `src/app/creator/hooks/useOnboardingFlow.ts` |
| `file_uploaded` | User uploads a file for course creation | `src/app/creator/hooks/useOnboardingFlow.ts` |
| `login_failed` | User login fails (for churn analysis) | `src/app/login/page.tsx` |
| `signup_failed` | User signup fails (for conversion analysis) | `src/app/signup/page.tsx` |
| `study_circle_joined` | User joins a study circle (pre-existing) | `src/app/(main)/socials/study-circles/page.tsx` |

## Pre-existing Events (Already Implemented)

The following events were already implemented in the codebase:
- `user_logged_in` - Tracks successful user logins
- `user_signed_up` - Tracks successful user signups
- `waitlist_joined` - Tracks users joining the waitlist
- `content_shared` - Tracks content sharing
- `course_created` - Tracks new course creation
- `course_deleted` - Tracks course deletion
- `study_circle_created` - Tracks new study circle creation
- `message_sent` - Tracks messages in study circles

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- **Analytics basics**: [https://us.posthog.com/project/273996/dashboard/946655](https://us.posthog.com/project/273996/dashboard/946655)

### Insights
1. **User Signups vs Logins (Weekly)**: [https://us.posthog.com/project/273996/insights/LQkIT1WE](https://us.posthog.com/project/273996/insights/LQkIT1WE)
   - Track weekly user signups and logins to monitor growth and retention

2. **Learning Journey Funnel**: [https://us.posthog.com/project/273996/insights/HnMBlcD3](https://us.posthog.com/project/273996/insights/HnMBlcD3)
   - Track user progression from course start to certificate generation

3. **Authentication Failures**: [https://us.posthog.com/project/273996/insights/KCuuSH7k](https://us.posthog.com/project/273996/insights/KCuuSH7k)
   - Track login and signup failures to identify conversion blockers and churn risks

4. **Course Creation Funnel**: [https://us.posthog.com/project/273996/insights/BbG3Zk94](https://us.posthog.com/project/273996/insights/BbG3Zk94)
   - Track user progression through the course creation onboarding flow

5. **Social Engagement Metrics**: [https://us.posthog.com/project/273996/insights/CurT2elm](https://us.posthog.com/project/273996/insights/CurT2elm)
   - Track referrals, sharing, and community engagement activities

## Technical Notes

- **Client-side initialization**: PostHog is initialized via `instrumentation-client.ts` using Next.js 15.3+ recommended approach
- **Server-side tracking**: Uses `posthog-node` via the `getPostHogClient()` helper in `src/lib/posthog-server.ts`
- **User identification**: Users are identified on login/signup with their user ID and email
- **Error tracking**: Login and signup failures are tracked with detailed error reasons

## Configuration Details

### Environment Variables
```
NEXT_PUBLIC_POSTHOG_KEY=phc_TqBjhlaEub6nP1apy6SeOkXQDMPnYmyaWCcqlxlG7t8
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### What's Next?

1. **Deploy your changes** - Make sure the PostHog environment variables are in your production environment
2. **Monitor the dashboard** - Watch your analytics populate as users interact with your app
3. **Set up alerts** - Configure alerts in PostHog for important metrics like signup drops or high churn
4. **Enable session recordings** - Consider enabling session replay for debugging user issues
5. **Create feature flags** - Use PostHog feature flags for gradual rollouts and A/B testing
