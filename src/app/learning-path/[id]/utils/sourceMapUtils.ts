/**
 * Source map validation and debugging utilities
 * Provides fallback debugging capabilities when source maps fail
 */

interface SourceMapValidationResult {
  isValid: boolean;
  error?: string;
  fallbackAvailable: boolean;
}

/**
 * Validates if a source map URL is properly formatted
 */
export function validateSourceMapURL(url: string): SourceMapValidationResult {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'Invalid or empty source map URL',
        fallbackAvailable: true
      };
    }

    // Check for common source map URL patterns
    const sourceMapPatterns = [
      /\.js\.map$/,
      /\.ts\.map$/,
      /\.jsx\.map$/,
      /\.tsx\.map$/,
      /data:application\/json;charset=utf-8;base64,/
    ];

    const isValidPattern = sourceMapPatterns.some(pattern => pattern.test(url));
    
    if (!isValidPattern) {
      return {
        isValid: false,
        error: 'URL does not match expected source map patterns',
        fallbackAvailable: true
      };
    }

    return {
      isValid: true,
      fallbackAvailable: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      fallbackAvailable: true
    };
  }
}

/**
 * Provides debugging information when source maps are unavailable
 */
export function getFallbackDebuggingInfo(componentName: string, error?: Error) {
  const debugInfo = {
    component: componentName,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    sourceMapStatus: 'unavailable',
    fallbackMethods: [
      'Console logging with component names',
      'React DevTools (if available)',
      'Error boundaries with component stack',
      'Manual debugging with console.trace()'
    ],
    suggestions: [
      'Check browser console for component-level logs',
      'Use React DevTools for component inspection',
      'Enable verbose logging in development',
      'Check network tab for failed source map requests'
    ]
  };

  if (error) {
    debugInfo.error = {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // Limit stack trace
    };
  }

  return debugInfo;
}

/**
 * Logs source map health check results
 */
export function performSourceMapHealthCheck(): void {
  if (typeof window === 'undefined') {
    // Server-side - skip health check
    return;
  }

  try {
    // Check if source maps are working by looking for .map files in network requests
    const performanceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const sourceMapRequests = performanceEntries.filter(entry => 
      entry.name.includes('.map') || entry.name.includes('sourcemap')
    );

    const healthStatus = {
      sourceMapRequestsFound: sourceMapRequests.length,
      totalResourceRequests: performanceEntries.length,
      sourceMapRatio: sourceMapRequests.length / performanceEntries.length,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: process.env.NODE_ENV
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('Source Map Health Check:', healthStatus);
      
      if (sourceMapRequests.length === 0) {
        console.warn('No source map requests detected. Debugging experience may be limited.');
        console.log('Fallback debugging methods available:', getFallbackDebuggingInfo('HealthCheck').fallbackMethods);
      }
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Source map health check failed:', error);
      console.log('This is non-critical - application will continue normally');
    }
  }
}

/**
 * Enhanced error logging that works without source maps
 */
export function logComponentError(componentName: string, error: Error, additionalContext?: any): void {
  const errorLog = {
    component: componentName,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    context: additionalContext,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
  };

  // Always log to console for development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Component Error: ${componentName}`);
    console.error('Error Details:', errorLog);
    console.log('Debugging Tips:', getFallbackDebuggingInfo(componentName, error).suggestions);
    console.groupEnd();
  }

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, errorLog);
    console.error(`Component Error in ${componentName}:`, error.message);
  }
}

/**
 * Wraps console methods to provide better debugging when source maps fail
 */
export function enhanceConsoleLogging(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = function(...args: any[]) {
    // Check if this is a source map error
    const isSourceMapError = args.some(arg => 
      typeof arg === 'string' && (
        arg.includes('source map') || 
        arg.includes('sourceMapURL') ||
        arg.includes('sourcemap')
      )
    );

    if (isSourceMapError) {
      console.warn('🗺️ Source map issue detected (non-breaking):', ...args);
      console.log('💡 Tip: This won\'t affect functionality, only debugging experience');
      return;
    }

    originalError.apply(console, args);
  };

  // Restore original methods when needed
  (window as any).__restoreConsole = () => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  };
}