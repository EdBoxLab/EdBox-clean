const GENIE_API_URL = '/api/pulse/genie';

export interface GenieMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenieRequest {
  message: string;
  sessionId?: string;
  history?: GenieMessage[];
  systemPrompt?: string;
  model?: string;
  tools?: boolean;
}

export interface GenieResponse {
  success: boolean;
  response?: string;
  sessionId: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  error?: string;
}

export async function sendGenieMessage(request: GenieRequest): Promise<GenieResponse> {
  const response = await fetch(GENIE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

export async function clearGenieSession(sessionId: string): Promise<void> {
  await fetch(`${GENIE_API_URL}?sessionId=${sessionId}`, {
    method: 'DELETE',
  });
}