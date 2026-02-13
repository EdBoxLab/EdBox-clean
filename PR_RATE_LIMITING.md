# Add Rate Limiting to Study Kit Generation API

## Summary

Implemented rate limiting for the study-kit generation API to prevent abuse and ensure fair resource allocation. The implementation uses Upstash Redis with a sliding window algorithm to limit authenticated users to 10 requests per 10 minutes.

## Changes Made

### 1. Rate Limiting Implementation

**Added Dependencies:**
- `@upstash/ratelimit@^2.0.4` - Rate limiting library
- `@upstash/redis@^1.34.3` - Redis client for Upstash

**New Files:**
- [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) - Rate limiter utility with singleton pattern
  - Configurable via environment variables
  - Graceful degradation if Redis credentials not configured
  - Uses sliding window algorithm (10 requests per 10 minutes)
  - Per-user rate limiting based on authenticated user ID

**Modified Files:**
- [`src/app/api/study-kit/generate/route.ts`](src/app/api/study-kit/generate/route.ts)
  - Added rate limit check AFTER authentication, BEFORE AI generation
  - Returns 429 status with clear error message when limit exceeded
  - Includes retry-after information and rate limit headers
  - Logs rate limit violations for monitoring

**Environment Variables:**
- Added to [`.env.example`](.env.example):
  ```
  UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url_here
  UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
  ```

### 2. Rate Limit Configuration

**Limits Applied:**
- **10 requests per 10 minutes** per authenticated user
- Sliding window algorithm for smooth rate limiting
- User-specific limits (keyed by user ID)

**Response Headers (on rate limit exceeded):**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until user can retry

**Error Response (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded the maximum number of study kit generation requests. Please try again later.",
  "retryAfter": 300,
  "resetAt": "2026-02-13T12:35:00.000Z",
  "limit": 10,
  "remaining": 0
}
```

### 3. Logging & Monitoring

**Rate Limit Events Logged:**
- ✅ Successful rate limit checks (with remaining count)
- ⚠️ Rate limit violations (with user ID, reset time)
- ⚠️ Missing Redis configuration (graceful degradation)

**Example Logs:**
```
✅ Rate limit check passed for user abc123. Remaining: 7/10
⚠️ Rate limit exceeded for user xyz789. Remaining: 0/10. Reset: 2026-02-13T12:35:00.000Z
```

## Secondary Review: Chapter ID Regeneration Issue

**Issue Documented:** [`docs/chapter-id-regeneration-issue.md`](docs/chapter-id-regeneration-issue.md)

**Problem Identified:**
- Chapter IDs are generated using array index: `id: \`ch_${i + 1}\``
- Found in 4 locations in [`src/lib/chapter-detection.ts`](src/lib/chapter-detection.ts)
- IDs regenerate on every detection, breaking references if chapter order changes

**Impact:**
- High risk if users can re-detect chapters from same document
- May break user progress tracking if chapter IDs change

**Status:**
- **DOCUMENTED ONLY** - No changes made per task constraints
- Requires explicit approval before modification
- Recommended solutions documented in issue file

## Testing

**Manual Testing:**
- ✅ Dependencies installed successfully
- ✅ TypeScript compilation passes
- ✅ Rate limiting logic integrated at correct position (after auth, before AI)
- ✅ Graceful degradation when Redis not configured

**Integration Points:**
- Rate limit check occurs immediately after authentication
- Does not interfere with existing file processing logic
- Does not affect chapter detection or content generation
- Maintains all existing error handling

## Deployment Notes

**Required Environment Variables:**
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Setup Instructions:**
1. Create Upstash Redis instance at https://upstash.com
2. Copy REST URL and token from Upstash dashboard
3. Add to environment variables in deployment platform
4. Rate limiting will activate automatically

**Graceful Degradation:**
- If Redis credentials not configured, rate limiting is disabled
- Warning logged: "⚠️ Upstash Redis credentials not configured. Rate limiting disabled."
- API continues to function normally without rate limiting

## Breaking Changes

None. This is a backward-compatible addition.

## Security Considerations

- Rate limiting prevents API abuse and resource exhaustion
- Per-user limits ensure fair resource allocation
- Sliding window algorithm prevents burst attacks
- User ID used as identifier (already authenticated)

## Future Improvements

- [ ] Add admin bypass for rate limits
- [ ] Implement tiered rate limits based on subscription level
- [ ] Add rate limit metrics to admin dashboard
- [ ] Consider different limits for different content types
- [ ] Fix chapter ID regeneration issue (requires approval)

---

Built for [edbox01101](https://edbox-group.slack.com/archives/C0AEP13T2UT/p1770985362598699?thread_ts=1770985163.164219&cid=C0AEP13T2UT) by [Kilo for Slack](https://kilo.ai/features/slack-integration)
