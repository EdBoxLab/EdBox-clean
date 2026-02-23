import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY_2 ? new Resend(process.env.RESEND_API_KEY_2) : null;

const ALERT_EMAILS = ['support@edbox.app', 'inioluwa@edbox.app', 'malik@edbox.app'];
const FROM_EMAIL = 'EdBox <hello@edbox.app>';

export interface LogAlert {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  statusCode?: number;
  path?: string;
  method?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function send4xxAlert(alert: LogAlert): Promise<void> {
  if (!resend) {
    console.log('[VercelLogMonitor] Resend not configured, skipping alert:', alert.message);
    return;
  }

  const statusEmoji = {
    400: '🔴',
    401: '🔴', 
    403: '🔴',
    404: '🔴',
    405: '🟠',
    408: '🟠',
    409: '🟠',
    422: '🟡',
    429: '🟡',
  }[alert.statusCode || 400] || '⚠️';

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${alert.statusCode === 400 ? '#fee2e2' : alert.statusCode === 401 ? '#fee2e2' : alert.statusCode === 403 ? '#fee2e2' : alert.statusCode === 404 ? '#fef3c7' : '#f3f4f6'}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; color: #1f2937;">
          ${statusEmoji} ${alert.statusCode} Error Alert
        </h2>
        <p style="margin: 0; color: ${alert.statusCode && alert.statusCode >= 400 ? '#dc2626' : '#4b5563'}; font-size: 16px;">
          ${alert.message}
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Timestamp:</td>
          <td style="padding: 8px 0; color: #1f2937;">${new Date(alert.timestamp).toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Status Code:</td>
          <td style="padding: 8px 0; color: #1f2937;"><strong>${alert.statusCode}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Path:</td>
          <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${alert.path || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Method:</td>
          <td style="padding: 8px 0; color: #1f2937;">${alert.method || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">User ID:</td>
          <td style="padding: 8px 0; color: #1f2937;">${alert.userId || 'Anonymous'}</td>
        </tr>
      </table>
      
      ${alert.metadata ? `
      <div style="background: #f9fafb; border-radius: 8px; padding: 15px;">
        <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Additional Details:</h3>
        <pre style="margin: 0; overflow-x: auto; font-size: 12px; color: #4b5563;">${JSON.stringify(alert.metadata, null, 2)}</pre>
      </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">Vercel Log Monitor - EdBox Platform</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ALERT_EMAILS,
      subject: `${statusEmoji} [${alert.statusCode}] ${alert.message} - ${alert.path || 'Unknown Path'}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[VercelLogMonitor] Failed to send email:', error);
    } else {
      console.log('[VercelLogMonitor] Alert email sent:', data?.id);
    }
  } catch (err) {
    console.error('[VercelLogMonitor] Error sending alert:', err);
  }
}

export function is4xxPattern(input: string | number): boolean {
  const str = String(input);
  return str === '400' || str.startsWith('4');
}

export async function logVercelEvent(
  message: string,
  statusCode: number,
  options?: {
    path?: string;
    method?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const alert: LogAlert = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? 'critical' : statusCode >= 400 ? 'error' : 'info',
    message,
    statusCode,
    ...options,
  };

  console.log(`[VercelLogMonitor] ${statusCode}: ${message}`, {
    path: options?.path,
    method: options?.method,
    userId: options?.userId,
  });

  if (is4xxPattern(statusCode)) {
    await send4xxAlert(alert);
  }
}

export function create4xxLogger(req: Request, userId?: string) {
  return {
    log: (message: string, statusCode: number, metadata?: Record<string, unknown>) => {
      const url = req.url ? new URL(req.url) : null;
      logVercelEvent(message, statusCode, {
        path: url?.pathname,
        method: req.method,
        userId,
        metadata,
      });
    },
    warn: (message: string, metadata?: Record<string, unknown>) => {
      logVercelEvent(message, 400, { path: new URL(req.url).pathname, method: req.method, userId, metadata });
    },
    error: (message: string, metadata?: Record<string, unknown>) => {
      logVercelEvent(message, 400, { path: new URL(req.url).pathname, method: req.method, userId, metadata });
    },
  };
}
