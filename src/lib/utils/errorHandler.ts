import { NextRequest, NextResponse } from 'next/server';

export interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  userId?: string;
  path?: string;
  userAgent?: string;
}

const SUPPORT_CONTACTS = {
  whatsapp: ['+2348167906554', '+2349134139043', '+2349057170553'],
  emails: ['support@edbox.app', 'inioluwa@edbox.app', 'malik@edbox.app']
};

export async function logErrorToSupport(errorLog: ErrorLog): Promise<void> {
  try {
    // In production, send to logging service (Sentry, LogRocket, etc.)
    console.error('ERROR LOGGED:', errorLog);
    
    // Store in database for review
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    
    await supabase.from('error_logs').insert({
      timestamp: errorLog.timestamp,
      error_message: errorLog.error,
      stack_trace: errorLog.stack,
      user_id: errorLog.userId,
      path: errorLog.path,
      user_agent: errorLog.userAgent
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

export function handleAPIError(error: any, req?: NextRequest, userId?: string): NextResponse {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: error.message || 'Unknown error',
    stack: error.stack,
    userId,
    path: req?.url,
    userAgent: req?.headers.get('user-agent') || undefined
  };

  // Log error to support
  logErrorToSupport(errorLog).catch(console.error);

  // Return friendly error to user
  return NextResponse.json(
    { 
      error: 'Something went wrong. Our team has been notified.',
      code: 500,
      support: SUPPORT_CONTACTS
    },
    { status: 500 }
  );
}

export function createErrorHandler(userId?: string) {
  return (error: any, req?: NextRequest) => handleAPIError(error, req, userId);
}

export { SUPPORT_CONTACTS };
