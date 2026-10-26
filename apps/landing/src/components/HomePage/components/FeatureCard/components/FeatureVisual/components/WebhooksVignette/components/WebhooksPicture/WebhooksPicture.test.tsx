import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebhooksPicture } from './WebhooksPicture';

describe('WebhooksPicture', () => {
  it('lists the webhooks on the app’s own panel, with the one that failed and its history', () => {
    render(<WebhooksPicture />);

    expect(screen.getByText('Discord announcements')).toBeInTheDocument();
    expect(screen.getByText('Home Assistant')).toBeInTheDocument();
    expect(screen.getAllByText('The server answered 500 Internal Server Error')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Resend' })).toBeInTheDocument();
  });

  it('is answered once the failed delivery is sent again', () => {
    render(<WebhooksPicture isActed />);

    expect(screen.queryByText('The server answered 500 Internal Server Error')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resend' })).toBeNull();
    expect(screen.getByText('4 attempts')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhooksPicture.displayName).toBe('WebhooksPicture');
  });
});
