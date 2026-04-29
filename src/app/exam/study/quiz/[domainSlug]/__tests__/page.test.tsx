import ExamQuizAliasPage from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('/exam/study/quiz/[domainSlug] alias route', () => {
  it('redirects to the primary exam quiz shell for the selected domain', async () => {
    await ExamQuizAliasPage({ params: Promise.resolve({ domainSlug: 'property-insurance' }) });
    expect(redirect).toHaveBeenCalledWith('/exams/insurance-us/study/quiz/property-insurance');
  });
});