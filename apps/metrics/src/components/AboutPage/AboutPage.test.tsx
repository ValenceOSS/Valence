import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('says what is sent, what never is, and how to stop it', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'About this data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is never sent or kept' })).toBeInTheDocument();
    expect(screen.getByText('The browser or program that sent it')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Exactly what is sent, field by field' }),
    ).toHaveAttribute('href', 'https://docs.getvalence.app/use/telemetry');
  });

  it('names every way a server’s owner can turn reporting off', () => {
    render(<AboutPage />);

    expect(screen.getByText(/Share anonymous usage\s+statistics/)).toBeInTheDocument();
    expect(screen.getByText(/access step of the setup wizard/)).toBeInTheDocument();
    expect(screen.getByText('VALENCE_TELEMETRY=off')).toBeInTheDocument();
    expect(screen.getByText('DO_NOT_TRACK=1')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AboutPage.displayName).toBe('AboutPage');
  });
});
