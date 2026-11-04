import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebhooksPicture } from './WebhooksPicture';

describe('WebhooksPicture', () => {
  it('opens the failing webhook on the app’s own page, with its history', () => {
    render(<WebhooksPicture />);

    expect(screen.getAllByText('Discord announcements').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('The server answered 500 Internal Server Error').length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Resend' })).toBeInTheDocument();
  });

  it('is answered once the failed delivery is sent again', () => {
    render(<WebhooksPicture isActed />);

    expect(screen.queryByText('The server answered 500 Internal Server Error')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resend' })).toBeNull();
    expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WebhooksPicture.displayName).toBe('WebhooksPicture');
  });
});
