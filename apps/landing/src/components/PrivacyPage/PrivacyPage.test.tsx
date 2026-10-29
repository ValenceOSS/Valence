import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrivacyPage } from './PrivacyPage';

describe('PrivacyPage', () => {
  it('names the page', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Privacy', level: 1 })).toBeInTheDocument();
  });

  it('says the software keeps a viewer’s data on their own server', () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/lives on your own server/)).toBeInTheDocument();
  });

  it('says what the anonymous statistics hold, how long they are kept and how to stop them', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { name: 'The anonymous statistics the software sends' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not store the IP address/)).toBeInTheDocument();
    expect(screen.getByText(/not heard from for twelve months is deleted/)).toBeInTheDocument();
    expect(screen.getByText(/VALENCE_TELEMETRY=off or DO_NOT_TRACK=1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'metrics.getvalence.app' })).toHaveAttribute(
      'href',
      'https://metrics.getvalence.app',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PrivacyPage.displayName).toBe('PrivacyPage');
  });
});
