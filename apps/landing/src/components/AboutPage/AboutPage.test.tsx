import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('names the page', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: /media server/ })).toBeInTheDocument();
  });

  it('says Valence stays self-hosted', () => {
    render(<AboutPage />);

    expect(screen.getByText(/Self-hosted first/)).toBeInTheDocument();
    expect(screen.getByText(/does not phone home/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AboutPage.displayName).toBe('AboutPage');
  });
});
