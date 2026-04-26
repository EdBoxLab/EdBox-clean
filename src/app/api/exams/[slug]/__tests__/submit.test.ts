jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'attempt-1' } } ) }) }),
    }),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'exam_questions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [{ id: 'q1', correct_answer: 'A' }] }) }),
            }),
          }),
        };
      }

      if (table === 'exam_kits') {
        return {
          select: jest.fn().mockReturnValue({
            match: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }

      return {};
    }),
  })),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ status: opts?.status || 200, json: async () => body }),
  },
  NextRequest: class {},
}));

describe('POST /api/exams/[slug]/submit', () => {
  it('scores and stores the attempt', async () => {
    const { POST } = require('../submit/route');
    const request = {
      json: async () => ({
        domainSlug: 'property-insurance',
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        responses: { q1: 'A' },
      }),
    };

    const response = await POST(request as any, { params: Promise.resolve({ slug: 'insurance-us' }) } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.score).toBe(100);
  });
});