import ExamStudyAliasPage from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('/exam/study alias route', () => {
  it('redirects to the primary exam study map', () => {
    ExamStudyAliasPage();
    expect(redirect).toHaveBeenCalledWith('/exams/insurance-us/study');
  });
});