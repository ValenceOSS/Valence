import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TermsPage } from './TermsPage';

describe('TermsPage', () => {
  it('names the page', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { name: 'Terms', level: 1 })).toBeInTheDocument();
  });

  it('names the licence the software ships under', () => {
    render(<TermsPage />);

    expect(screen.getByText(/MIT licence/)).toBeInTheDocument();
  });

  it('links to the full licence text', () => {
    render(<TermsPage />);

    expect(screen.getByRole('link', { name: 'LICENSE.md' })).toHaveAttribute(
      'href',
      'https://github.com/MarquesCoding/Valence/blob/main/LICENSE.md',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TermsPage.displayName).toBe('TermsPage');
  });
});
