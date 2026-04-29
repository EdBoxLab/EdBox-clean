import { getExamRuntimeBySlug, scoreExamResponses } from '../engine';

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

      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      };
    }),
  })),
}));

describe('exam engine', () => {
  it('falls back to bundled exam config when DB kit is missing', async () => {
    const runtime = await getExamRuntimeBySlug('insurance-us');
    expect(runtime.exam.slug).toBe('insurance-us');
    expect(runtime.domains.length).toBeGreaterThan(0);
  });

  it('scores responses based on exact answers', () => {
    const result = scoreExamResponses(
      [
        {
          id: 'q1',
          exam_id: 'e1',
          domain_id: 'd1',
          question_type: 'mcq',
          question_text: 'Question 1',
          options: ['A', 'B'],
          correct_answer: 'A',
          explanation: 'Because',
          difficulty: 3,
        },
      ],
      { q1: 'A' }
    );

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });
});