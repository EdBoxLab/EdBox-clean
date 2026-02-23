import { NextRequest, NextResponse } from 'next/server';
import { logVercelEvent, is4xxPattern, send4xxAlert, LogAlert } from '@/lib/utils/vercel-log-monitor';

interface VercelLogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'function' | 'lambda' | 'build' | 'edge';
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  memory?: number;
  projectId?: string;
  deploymentId?: string;
  source?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const logs: VercelLogEntry[] = body.logs || [body];
    
    let alertsSent = 0;

    for (const log of logs) {
      const statusCode = log.status;
      
      if (statusCode && is4xxPattern(statusCode)) {
        const alert: LogAlert = {
          timestamp: log.timestamp || new Date().toISOString(),
          level: 'error',
          message: log.message || `Vercel ${statusCode} Error`,
          statusCode,
          path: log.path,
          method: log.method,
          metadata: {
            vercelLogId: log.id,
            type: log.type,
            duration: log.duration,
            deploymentId: log.deploymentId,
            source: 'vercel-log-drain'
          }
        };

        await send4xxAlert(alert);
        alertsSent++;
      }
      
      if (log.message && is4xxPattern(log.message)) {
        const alert: LogAlert = {
          timestamp: log.timestamp || new Date().toISOString(),
          level: 'error',
          message: log.message,
          statusCode: statusCode || 400,
          path: log.path,
          method: log.method,
          metadata: {
            vercelLogId: log.id,
            type: log.type,
            source: 'vercel-log-drain'
          }
        };

        await send4xxAlert(alert);
        alertsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: logs.length,
      alertsTriggered: alertsSent
    });
  } catch (error) {
    console.error('[VercelLogDrain] Error processing logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/monitor/vercel-logs/drain',
    vercelIntegration: 'log-drain',
    instructions: [
      '1. Go to Vercel Dashboard > Settings > Git',
      '2. Create a Log Drain',
      '3. Set URL to: your-domain.com/api/monitor/vercel-logs/drain',
      '4. Select "Production" or "All" logs',
      '5. Events: request, function, lambda'
    ]
  });
}
