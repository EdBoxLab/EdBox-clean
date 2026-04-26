import { render, screen } from '@testing-library/react';
import { ExamOverview } from '../ExamOverview';
import { examCatalog } from '@/lib/exams/catalog';

describe('ExamOverview', () => {
  it('renders the exam overview with key exam data', () => {
    render(<ExamOverview exam={examCatalog[0]} />);

    expect(screen.getByRole('heading', { name: /insurance licensing exam/i })).toBeInTheDocument();
    expect(screen.getByText('24-32 hours')).toBeInTheDocument();
    expect(screen.getByText('$49.00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start free/i })).toHaveAttribute('href', '/signup');
    expect(screen.getByText(/property insurance/i)).toBeInTheDocument();
    expect(screen.getByText(/readiness loop/i)).toBeInTheDocument();
  });
});