import ExamAliasPage from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('/exam alias route', () => {
  it('redirects to the primary exam overview', () => {
    ExamAliasPage();
    expect(redirect).toHaveBeenCalledWith('/exams/insurance-us');
  });
});