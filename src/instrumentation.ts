import { logVercelEvent, is4xxPattern } from '@/lib/utils/vercel-log-monitor';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function (...args: unknown[]) {
      originalError.apply(console, args);
      
      const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      
      if (is4xxPattern(message) || message.includes(' 4') || message.includes(' 400') || message.includes('error 4')) {
        logVercelEvent(message, 400, {
          metadata: { source: 'console.error', args }
        });
      }
    };

    console.warn = function (...args: unknown[]) {
      originalWarn.apply(console, args);
      
      const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      
      if (is4xxPattern(message)) {
        logVercelEvent(message, 400, {
          metadata: { source: 'console.warn', args }
        });
      }
    };
  }
}
