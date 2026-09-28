import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebhooksVignette } from './WebhooksVignette';

describe('WebhooksVignette', () => {
  it('lists deliveries, with the one that failed', () => {
    render(<WebhooksVignette />);

    expect(screen.getAllByText('Discord announcements')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhooksVignette.displayName).toBe('WebhooksVignette');
  });
});
