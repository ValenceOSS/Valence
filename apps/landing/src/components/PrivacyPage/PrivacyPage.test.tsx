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

  it('sets a display name so devtools can identify it', () => {
    expect(PrivacyPage.displayName).toBe('PrivacyPage');
  });
});
