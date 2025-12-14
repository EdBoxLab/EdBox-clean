export {};

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ status: opts?.status || 200, json: async () => body })
  },
  NextRequest: function() {}
}));

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn()
}));

const { createSupabaseServerClient } = require('@/lib/supabase/server');
const messagesRoute = require('../[circleId]/messages/route');

describe('Study circle messages API', () => {
  beforeEach(() => jest.resetAllMocks());

    // Helper to build a chainable `.select().eq().eq().maybeSingle()` mock
    const makeMemberSelectMock = (result: any) => {
      const maybeSingle = jest.fn().mockResolvedValue({ data: result });
      const eq2 = jest.fn().mockReturnValue({ maybeSingle });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const select = jest.fn().mockReturnValue({ eq: eq1 });
      return select;
    };

    test('GET returns messages for member', async () => {
      const mockUser = { id: 'user-1' };
      const msg = { id: 1, content: 'hello' };

      const supabaseMock = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'circle_members') return { select: makeMemberSelectMock({ user_id: mockUser.id }) };
          return {};
        }),
        rpc: jest.fn().mockResolvedValue({ data: [msg] }),
      };

      createSupabaseServerClient.mockResolvedValue(supabaseMock);

      const res = await messagesRoute.GET({} as any, { params: Promise.resolve({ circleId: '33' }) } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([msg]);
    });

    test('GET returns 403 for non-member', async () => {
      const mockUser = { id: 'user-1' };

      const supabaseMock = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'circle_members') return { select: makeMemberSelectMock(null) };
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(supabaseMock);

      const res = await messagesRoute.GET({} as any, { params: Promise.resolve({ circleId: '33' }) } as any);

      expect(res.status).toBe(403);
    });

    test('POST inserts message for member', async () => {
      const mockUser = { id: 'user-1' };
      const newMsg = { id: 5, content: 'hi' };

      const supabaseMock = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'circle_members') return { select: makeMemberSelectMock({ user_id: mockUser.id }) };
          if (table === 'messages') {
          const single = jest.fn().mockResolvedValue({ data: newMsg, error: null });
          const select = jest.fn().mockReturnValue({ single });
          const insert = jest.fn().mockReturnValue({ select });
          return { insert };
        }
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(supabaseMock);

      const req = { json: async () => ({ content: 'hi', username: 'Me' }) } as any;
      const res = await messagesRoute.POST(req, { params: Promise.resolve({ circleId: '33' }) } as any);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.id).toBe(newMsg.id);
    });

    test('POST returns 403 for non-member', async () => {
      const mockUser = { id: 'user-1' };

      const supabaseMock = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
        from: jest.fn().mockImplementation((table: string) => {
          if (table === 'circle_members') return { select: makeMemberSelectMock(null) };
          return {};
        }),
      };

      createSupabaseServerClient.mockResolvedValue(supabaseMock);

      const req = { json: async () => ({ content: 'hi', username: 'Me' }) } as any;
      const res = await messagesRoute.POST(req, { params: Promise.resolve({ circleId: '33' }) } as any);

      expect(res.status).toBe(403);
    });
});