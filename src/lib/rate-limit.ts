import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: InstanceType<typeof Ratelimit> | null = null;

export function getRateLimiter() {
  if (ratelimit) return ratelimit;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    console.warn('⚠️ Upstash Redis credentials not configured. Rate limiting disabled.');
    return null;
  }

  const redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 m'),
    analytics: true,
    prefix: 'edbox:ratelimit:study-kit',
  });

  return ratelimit;
}
