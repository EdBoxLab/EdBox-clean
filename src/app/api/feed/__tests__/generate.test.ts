jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({ choices: [{ message: { content: '[]' } }] })
      }
    }
  }));
});

// Mock Next.js runtime pieces that expect global Request/Response in Node test env
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ status: opts?.status || 200, json: async () => body })
  },
  NextRequest: class {}
}));

describe('Feed generate route - shorts inclusion', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY = 'test-key';
    process.env.GROQ_API_KEY_8 = 'test-groq-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    jest.resetAllMocks();
  });

  it('includes video items when YouTube returns shorts', async () => {
    // Mock fetch for YouTube API
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('youtube')) {
        return Promise.resolve({
          json: async () => ({
            items: [
              { id: { videoId: 'vid123' }, snippet: { title: 'Short 1', description: 'desc', thumbnails: { high: { url: 'thumb1' } } } },
              { id: { videoId: 'vid456' }, snippet: { title: 'Short 2', description: 'desc2', thumbnails: { high: { url: 'thumb2' } } } }
            ]
          })
        } as any);
      }

      // default response for other fetches
      return Promise.resolve({ json: async () => ({}) } as any);
    });

    const { POST } = require('../generate/route');

    const req = { json: async () => ({ interests: ['JavaScript'], likedTopics: [], excludeTypes: [] }) };
    const res = await POST(req as any);
    const body = await res.json();

    expect(Array.isArray(body)).toBe(true);
    const hasVideo = body.some((i: any) => i.type === 'video');
    expect(hasVideo).toBe(true);
  });
});
