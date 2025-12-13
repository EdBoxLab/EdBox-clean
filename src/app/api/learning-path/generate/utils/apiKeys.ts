export type ApiKeyState = {
  key: string;
  provider: 'groq' | 'gemini';
  exhaustedUntil: number;
  activeRequests: number;
  lastUsed: number;
};

export const keyStates: ApiKeyState[] = [];

for (let i = 1; i <= 38; i++) {
  const key = process.env[`GROQ_API_KEY${i === 1 ? '' : `_${i}`}`];
  if (key) keyStates.push({
    key,
    provider: 'groq',
    exhaustedUntil: 0,
    activeRequests: 0,
    lastUsed: 0
  });
}

for (let i = 1; i <= 15; i++) {
  const key = process.env[`GEMINI_API_KEY${i === 1 ? '' : `_${i}`}`];
  if (key) keyStates.push({
    key,
    provider: 'gemini',
    exhaustedUntil: 0,
    activeRequests: 0,
    lastUsed: 0
  });
}

export const allKeysConfigured = keyStates.length > 0;
