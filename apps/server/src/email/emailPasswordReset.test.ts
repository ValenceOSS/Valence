import { describe, expect, it, vi } from 'vitest';
import { NO_EMAIL } from './NO_EMAIL';
import { emailPasswordReset } from './emailPasswordReset';
import type { EmailService } from './EmailService';

describe('emailPasswordReset', () => {
  it('sends the link once per link, saying it lasts an hour', async () => {
    const sendPasswordReset = vi.fn<EmailService['sendPasswordReset']>(() =>
      Promise.resolve({ kind: 'sent' }),
    );
    const email = { ...NO_EMAIL, sendPasswordReset };
    const reset = { to: 'ada@example.com', name: 'Ada', url: 'https://v.example/r/1', at: 0 };

    expect(await emailPasswordReset(email, reset)).toEqual({ kind: 'sent' });
    await emailPasswordReset(email, reset);
    await emailPasswordReset(email, { ...reset, url: 'https://v.example/r/2' });

    const keys = sendPasswordReset.mock.calls.map((call) => call[0].idempotencyKey);

    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(sendPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ada@example.com',
        name: 'Ada',
        url: 'https://v.example/r/1',
        expiresAt: new Date(60 * 60 * 1000),
      }),
    );
  });
});
