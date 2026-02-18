const CHAT_API_URL = '/api/pulse/chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  model?: string;
  activityContext?: string | {
    recentTopics?: string[];
    currentCourse?: string;
    lastActive?: string;
  };
  currentWindows?: any[];
}

export interface ChatResponse {
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

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(CHAT_API_URL, {
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

export async function clearChatSession(sessionId: string): Promise<void> {
  await fetch(`${CHAT_API_URL}?sessionId=${sessionId}`, {
    method: 'DELETE',
  });
}