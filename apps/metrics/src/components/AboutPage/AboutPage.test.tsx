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

  it('sets a display name so devtools can identify it', () => {
    expect(AboutPage.displayName).toBe('AboutPage');
  });
});
