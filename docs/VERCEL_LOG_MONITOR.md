# Vercel Log Monitor - 4xx Alert System

This system sends email notifications whenever a 400, 401, 403, 404, or any 4xx error occurs in your Vercel logs.

## Setup

### 1. Environment Variables

Ensure `RESEND_API_KEY_2` is set in your `.env.local` (already configured):

```env
RESEND_API_KEY_2=re_123456789
```

### 2. Vercel Log Drain (Recommended)

For comprehensive log monitoring, set up a Vercel Log Drain:

1. Go to **Vercel Dashboard** → **Settings** → **Git**
2. Find **Log Drains** and create a new one
3. Set the **URL** to: `https://your-domain.com/api/monitor/vercel-logs/drain`
4. Select **Production** or **All** environments
5. Choose events: `request`, `function`, `lambda`

### 3. API Integration

Use the utility in any API route:

```typescript
import { logVercelEvent } from '@/lib/utils/vercel-log-monitor';

export async function GET(req: Request) {
  const userData = await fetchUserData();
  
  if (!userData) {
    await logVercelEvent('User not found', 404, {
      path: '/api/users',
      method: 'GET',
      userId: 'user123'
    });
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  return NextResponse.json(userData);
}
```

### 4. Use with Error Handler

The existing `handleAPIError` now automatically triggers alerts for 4xx errors:

```typescript
import { handleAPIError } from '@/lib/utils/errorHandler';

export async function GET(req: Request) {
  try {
    // Your code
  } catch (error) {
    return handleAPIError(error, req, userId);
  }
}
```

### 5. Manual Logger

Create a logger for a specific request:

```typescript
import { create4xxLogger } from '@/lib/utils/vercel-log-monitor';

export async function POST(req: Request) {
  const logger = create4xxLogger(req, userId);
  
  const validation = validateInput(req.body);
  if (!validation.valid) {
    logger.error('Validation failed', { errors: validation.errors });
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/monitor/vercel-logs` | POST | Manual log submission |
| `/api/monitor/vercel-logs/drain` | POST | Vercel Log Drain receiver |
| `/api/monitor/vercel-logs` | GET | Health check |

## Alert Behavior

- **Emails**: Sent instantly on every 4xx error to `support@edbox.app`, `inioluwa@edbox.app`, `malik@edbox.app`
- **No cooldown**: Alerts fire every time an error occurs
- **Status Codes**: Catches any 4xx error (400, 401, 403, 404, etc.)

## Patterns Matched

- `400` - Bad Request
- `401` - Unauthorized  
- `403` - Forbidden
- `404` - Not Found
- Any status code starting with `4`
