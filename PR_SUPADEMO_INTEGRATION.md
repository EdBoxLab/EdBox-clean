# PR: Replace Driver.js Tour with Supademo Interactive Demos

## Summary

Replaced the outdated driver.js-based app tour system with Supademo, a modern interactive demo platform. This provides users with a polished, professional walkthrough experience that explains how to use EdBox effectively.

## Problem

- Users complained they didn't know how to use EdBox
- The previous driver.js tour was described as "ugly" and ineffective
- No consistent way to show the tour to new vs existing users
- Manual "App Tour" trigger wasn't working properly

## Solution

Implemented Supademo integration that:
- Shows Supademo tour automatically to new users after onboarding
- Shows Supademo overlay once to existing users on their next login
- Replaces the existing "App Tour" menu item to trigger Supademo instead of driver.js

## Changes Made

### 1. Modified Files

#### `src/app/(main)/layout.tsx`
- Added Supademo script loading via Next.js Script component
- Added TypeScript declaration for `window.Supademo` interface

```tsx
declare global {
  interface Window {
    Supademo?: {
      open: (demoId: string) => void;
    };
  }
}

<Script 
  src="https://script.supademo.com/supademo.js" 
  strategy="afterInteractive"
/>
```

#### `src/components/AppTour.tsx`
- Replaced driver.js implementation with Supademo integration
- Uses Supademo demo ID: `cmllhfspu2bdt5yi35o3fmqi8`
- Logic:
  - Checks if user has onboarded and hasn't seen Supademo
  - Shows Supademo after 2-second delay for onboarded users
  - Marks user as having seen Supademo in database
  - Listens for `restart-tour` event to manually trigger tour

```tsx
const SUPADEMO_ID = 'cmllhfspu2bdt5yi35o3fmqi8';

useEffect(() => {
  const checkAndShowTour = async () => {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('supademo_seen, onboarded')
      .eq('id', user.id)
      .maybeSingle();

    const hasSeenSupademo = prefs?.supademo_seen ?? false;
    const isOnboarded = prefs?.onboarded ?? false;

    if (!hasSeenSupademo && isOnboarded) {
      setTimeout(() => {
        openSupademo();
        markSupademoSeen(user.id);
      }, 2000);
    }
  };

  window.addEventListener('restart-tour', handleRestartTour);
}, []);
```

#### `src/services/userPreferencesService.ts`
- Added `supademo_seen` field to `DBUserPreferences` interface
- Updated `getUserPreferences` to return `supademo_seen`
- Updated `saveUserPreferences` to save `supademo_seen`

#### `src/types/feed.ts`
- Added `supademo_seen?: boolean` to `UserPreferences` interface

### 2. New Files Created

#### `supabase/migrations/20250214000000_add_supademo_seen.sql`
- Database migration to add `supademo_seen` column to `user_preferences` table
- Default value: `FALSE`

```sql
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS supademo_seen BOOLEAN DEFAULT FALSE;
```

## User Flows

### New Users (After Onboarding)
1. User completes onboarding (selects interests, learning style)
2. Onboarding marks user as `onboarded = true`
3. AppTour detects user is onboarded but hasn't seen Supademo
4. After 2 seconds delay, Supademo tour automatically opens
5. User completes or closes tour
6. `supademo_seen` is set to `true` in database

### Existing Users (On Next Login)
1. User logs in
2. AppTour checks if user has `supademo_seen = false` and `onboarded = true`
3. If both conditions met, Supademo tour opens automatically
4. User completes or closes tour
5. `supademo_seen` is set to `true`

### Manual Tour Trigger
1. User clicks "App Tour" in UserMenu dropdown
2. UserMenu dispatches `restart-tour` event
3. AppTour listens for event and opens Supademo
4. No database update (this is just to re-view the tour)

## Configuration

Supademo demo ID is defined in `src/components/AppTour.tsx`:

```tsx
const SUPADEMO_ID = 'cmllhfspu2bdt5yi35o3fmqi8';
```

To use a different Supademo demo, update this constant.

## Database Requirements

Run the migration to add the `supademo_seen` column:

```bash
npx supabase db push
```

Or apply the migration file directly:
```bash
psql -h <host> -U <user> -d <database> -f supabase/migrations/20250214000000_add_supademo_seen.sql
```

## Testing

### New User Flow
1. Create a new test user or reset an existing user's `onboarded` to `false`
2. Complete onboarding as the new user
3. Verify Supademo tour appears after 2 seconds
4. Check database: `supademo_seen` should be `true`

### Existing User Flow
1. Find a user who has `onboarded = true` and `supademo_seen = false`
2. Have that user log in
3. Verify Supademo tour appears automatically
4. Check database: `supademo_seen` should be `true`

### Manual Trigger
1. Click "App Tour" in the user menu
2. Verify Supademo tour opens
3. Verify no database change occurs

## Benefits

- **Better UX**: Professional, interactive demo instead of basic popovers
- **Improved Adoption**: Users understand how to use EdBox features
- **One-time Only**: Existing users see it once, not every login
- **Manual Replay**: Users can re-watch the tour anytime via App Tour menu
- **No Dependencies**: Removed driver.js library (if not used elsewhere)

## Rollback Plan

If issues occur:
1. The database migration is backwards-compatible (adds nullable column with default)
2. To rollback: `ALTER TABLE user_preferences DROP COLUMN supademo_seen;`
3. AppTour.tsx can be reverted to use driver.js if needed

## Checklist

- [x] Added Supademo script to layout.tsx
- [x] Added TypeScript declaration for window.Supademo
- [x] Updated AppTour.tsx to use Supademo
- [x] Added supademo_seen field to userPreferencesService.ts
- [x] Added supademo_seen to UserPreferences type
- [x] Created database migration
- [x] Tested new user flow
- [x] Tested existing user flow
- [x] Tested manual trigger flow
- [x] Created PR documentation
