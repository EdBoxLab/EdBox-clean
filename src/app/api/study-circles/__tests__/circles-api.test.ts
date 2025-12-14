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

const studyCirclesRoute = require('../route');
const joinRoute = require('../join/route');
const membersRoute = require('../[circleId]/members/route');

describe('Study circles API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('POST /api/study-circles creates a circle and adds creator as admin', async () => {
    const mockUser = { id: 'user-1' };

    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      rpc: jest.fn().mockResolvedValue({ data: 'INV1234' }),
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'study_circles') {
          return {
            insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 42, name: 'Test' } } ) }) })
          };
        }
        if (table === 'circle_members') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return { insert: jest.fn().mockResolvedValue({}) };
      })
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = { json: async () => ({ name: 'Test Circle', description: 'Desc' }) };
    const res = await studyCirclesRoute.POST(req as any);

    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.id).toBe(42);
  });

  test('POST /api/study-circles rolls back when member insert fails (null user_id)', async () => {
    const mockUser = { id: 'user-x' };

    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      rpc: jest.fn().mockResolvedValue({ data: 'INV987' }),
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'study_circles') {
          return {
            insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 99, name: 'RollbackCircle' } } ) }) }),
            delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
          };
        }

        if (table === 'circle_members') {
          return {
            insert: jest.fn().mockResolvedValue({ error: { code: '23502', message: 'null value in column "user_id" of relation "circle_members" violates not-null constraint' } })
          };
        }

        return { insert: jest.fn().mockResolvedValue({}) };
      })
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = { json: async () => ({ name: 'Will Rollback' }) };
    const res = await studyCirclesRoute.POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Creator user id is missing/);
  });

  test('POST /api/study-circles returns 401 when user id is missing', async () => {
    const mockUser = { id: undefined };

    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = { json: async () => ({ name: 'No ID Circle' }) };
    const res = await studyCirclesRoute.POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  test('POST /api/study-circles/join joins by invite code', async () => {
    const mockUser = { id: 'u1' };
    const circle = { id: 99, name: 'C' };

    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'study_circles') {
          return { select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: circle }) }) }) };
        }
        if (table === 'circle_members') {
          return {
            select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) }),
            insert: jest.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      })
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = { json: async () => ({ invite_code: 'INV' }) };
    const res = await joinRoute.POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.circle_id).toBe(circle.id);
  });

  test('POST /api/study-circles/:id/members joins by id', async () => {
    const mockUser = { id: 'u2' };
    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'circle_members') {
          return {
            select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) }),
            insert: jest.fn().mockResolvedValue({ error: null })
          };
        }
        return {};
      })
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = { };
    const context = { params: Promise.resolve({ circleId: '123' }) };

    const res = await membersRoute.POST(req as any, context as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  test('DELETE /api/study-circles/:id/members leaves circle', async () => {
    const mockUser = { id: 'u3' };
    const supabaseMock = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'circle_members') {
          // Return chainable methods: delete().eq().eq() -> resolves to { error: null }
          const lastResult = Promise.resolve({ error: null });
          const eqFn = jest.fn().mockReturnValue(lastResult);
          const deleteFn = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(lastResult) }) });
          return { delete: deleteFn };
        }
        return {};
      })
    };

    createSupabaseServerClient.mockResolvedValue(supabaseMock);

    const req = {};
    const context = { params: Promise.resolve({ circleId: '123' }) };

    const res = await membersRoute.DELETE(req as any, context as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
