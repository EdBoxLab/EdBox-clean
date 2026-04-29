import { render, screen } from '@testing-library/react';
import { ExamStudyMap } from '../ExamStudyMap';
import { examCatalog } from '@/lib/exams/catalog';

describe('ExamStudyMap', () => {
  it('renders the readiness summary and weakest domain', () => {
    render(<ExamStudyMap exam={examCatalog[0]} />);

    expect(screen.getByRole('heading', { name: /study what matters most/i })).toBeInTheDocument();
    expect(screen.getByText(/58\s*%/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /start with property insurance/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open quiz shell/i })).toHaveAttribute('href', '/exams/insurance-us/study/quiz/property-insurance');
  });
});