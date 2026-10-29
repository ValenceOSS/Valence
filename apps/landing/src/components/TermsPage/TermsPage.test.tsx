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
      'https://github.com/ValenceOSS/Valence/blob/main/LICENSE.md',
    );
  });

  it('says the software sends anonymous statistics unless turned off', () => {
    render(<TermsPage />);

    expect(screen.getByRole('heading', { name: 'Anonymous usage statistics' })).toBeInTheDocument();
    expect(screen.getByText(/VALENCE_TELEMETRY=off or DO_NOT_TRACK=1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'the documentation' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/use/telemetry',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TermsPage.displayName).toBe('TermsPage');
  });
});
