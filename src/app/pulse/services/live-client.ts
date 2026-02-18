const LIVE_API_URL = '/api/pulse/live';

export interface LiveConfig {
  configured: boolean;
  apiKey?: string;
  tools?: Array<unknown>;
  model?: string;
  voiceConfig?: {
    voice: string;
    language: string;
  };
  error?: string;
}

export interface LiveSessionRequest {
  action: 'start' | 'end';
  sessionId?: string;
  audioData?: string;
}

export interface LiveSessionResponse {
  success: boolean;
  sessionId?: string;
  apiKey?: string;
  tools?: Array<unknown>;
  model?: string;
  error?: string;
  message?: string;
}

export async function getLiveConfig(): Promise<LiveConfig> {
  const response = await fetch(LIVE_API_URL, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      configured: false,
      error: error.error || 'Failed to get configuration',
    };
  }

  return response.json();
}

export async function manageLiveSession(request: LiveSessionRequest): Promise<LiveSessionResponse> {
  const response = await fetch(LIVE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      error: error.error || 'Failed to manage session',
    };
  }

  return response.json();
}

export async function startLiveSession(sessionId: string): Promise<LiveSessionResponse> {
  return manageLiveSession({ action: 'start', sessionId });
}

export async function endLiveSession(sessionId: string): Promise<LiveSessionResponse> {
  return manageLiveSession({ action: 'end', sessionId });
}