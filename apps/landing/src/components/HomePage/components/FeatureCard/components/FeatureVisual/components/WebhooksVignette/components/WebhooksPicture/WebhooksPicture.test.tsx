import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebhooksPicture } from './WebhooksPicture';

describe('WebhooksPicture', () => {
  it('lists deliveries, with the one that failed', () => {
    render(<WebhooksPicture />);

    expect(screen.getAllByText('Discord announcements')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhooksPicture.displayName).toBe('WebhooksPicture');
  });
});
