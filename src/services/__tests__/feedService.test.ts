jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent: jest.fn() } })),
  Type: {},
  Modality: {}
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: { from: jest.fn().mockReturnValue({ insert: jest.fn().mockResolvedValue({ error: null }) }) }
}));

const { persistFeedItems } = require('../feedService');

describe('persistFeedItems', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves items under user-specific key', async () => {
    const items = [
      { id: 'a1', type: 'article', content: { title: 'Test' } },
    ];

    await persistFeedItems(items as any, 'user123');

    const stored = JSON.parse(localStorage.getItem('feed_items_user123') || 'null');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe('article');
    expect(stored[0].content.title).toBe('Test');
    expect(stored[0].generated_at).toBeDefined();
  });

  it('appends to existing entries', async () => {
    const items1 = [{ id: 'a1', type: 'article', content: { title: 'First' } }];
    const items2 = [{ id: 'b2', type: 'fact', content: { text: 'Second' } }];

    await persistFeedItems(items1 as any, 'userABC');
    await persistFeedItems(items2 as any, 'userABC');

    const stored = JSON.parse(localStorage.getItem('feed_items_userABC') || 'null');
    expect(stored).toHaveLength(2);
    expect(stored.map((s: any) => s.type)).toEqual(['article', 'fact']);
  });

  it('uses anonymous key when no userId provided', async () => {
    const items = [{ id: 'x1', type: 'story', content: { story: 'Anon' } }];
    await persistFeedItems(items as any);

    const stored = JSON.parse(localStorage.getItem('feed_items_anonymous') || 'null');
    expect(stored).toHaveLength(1);
    expect(stored[0].type).toBe('story');
  });
});
