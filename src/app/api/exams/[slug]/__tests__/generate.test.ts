import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'exam_kits') {
        return {
          select: jest.fn().mockReturnValue({
            match: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }

      if (table === 'exam_questions') {
        return {
          select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [] }) }),
        };
      }

      if (table === 'exam_domains') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [] }) }),
            }),
          }),
        };
      }

      if (table === 'exam_materials') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [] }) }),
          }),
        };
      }

      return {};
    }),
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'exam_kits') {
        return {
          select: jest.fn().mockReturnValue({
            match: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            }),
          }),
        };
      }

      if (table === 'exam_questions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [] }) }),
            }),
          }),
          insert: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [{ id: 'q1' }] }) }),
        };
      }

      if (table === 'study_kit_content') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null }) }),
          }),
        };
      }

      return {
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [] }) }) }),
      };
    }),
  })),
}));

jest.mock('@/lib/ai-providers', () => ({
  generateWithRetry: jest.fn().mockResolvedValue({
    provider: 'gemini',
    text: JSON.stringify({
      questions: [
        {
          question: 'What is insurance?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'It is coverage.',
          difficulty: 2,
          questionType: 'mcq',
        },
      ],
    }),
  }),
  cleanJsonResponse: jest.requireActual('@/lib/ai-providers').cleanJsonResponse,
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ status: opts?.status || 200, json: async () => body }),
  },
  NextRequest: class {},
}));

describe('POST /api/exams/[slug]/generate', () => {
  it('generates questions from bundled fallback content', async () => {
    const { POST } = require('../generate/route');
    const request = { json: async () => ({ domainSlug: 'property-insurance', count: 1 }) };
    const response = await POST(request as any, { params: Promise.resolve({ slug: 'insurance-us' }) } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.questions.length).toBe(1);
  });
});