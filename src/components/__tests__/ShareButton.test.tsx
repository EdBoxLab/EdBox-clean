import { render, screen, fireEvent } from '@testing-library/react';
import ShareButton from '../ShareButton';
import { ShareableContent } from '@/lib/services/sharing-service';

// Mock the sharing service
jest.mock('@/lib/services/sharing-service', () => ({
  generateShareUrl: jest.fn(() => 'https://example.com/share'),
  shareToTwitter: jest.fn(),
  shareToFacebook: jest.fn(),
  copyShareLink: jest.fn(() => Promise.resolve(true)),
  trackShare: jest.fn(() => Promise.resolve()),
  getShareCount: jest.fn(() => Promise.resolve(5))
}));

const mockContent: ShareableContent = {
  type: 'course',
  id: 'test-course-1',
  title: 'Test Course',
  description: 'A test course for sharing',
  creatorName: 'Test Creator'
};

describe('ShareButton', () => {
  it('renders share button correctly', () => {
    render(
      <ShareButton
        content={mockContent}
        userId="test-user"
        variant="button"
        size="md"
      />
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('opens share menu when clicked', () => {
    render(
      <ShareButton
        content={mockContent}
        userId="test-user"
        variant="button"
        size="md"
      />
    );

    fireEvent.click(screen.getByText('Share'));
    expect(screen.getByText('Share this course')).toBeInTheDocument();
  });

  it('displays share count when enabled', () => {
    render(
      <ShareButton
        content={mockContent}
        userId="test-user"
        variant="button"
        size="md"
        showCount={true}
      />
    );

    // The share count should be displayed
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('renders as icon variant', () => {
    render(
      <ShareButton
        content={mockContent}
        userId="test-user"
        variant="icon"
        size="sm"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-100');
  });
});