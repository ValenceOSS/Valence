import { describe, expect, it, vi } from 'vitest';
import { createPasswordResetRequests } from './createPasswordResetRequests';

const ADA = { userId: 'u1', email: 'ada@example.com' };

describe('createPasswordResetRequests', () => {
  it('asks for a reset for the account found, by who they say they are', async () => {
    const findAccount = vi.fn(() => Promise.resolve(ADA));
    const request = vi.fn(() => Promise.resolve());
    const ask = createPasswordResetRequests({ findAccount, request });

    await ask({ identifier: 'ada' }, 'https://valence.example/reset-password');

    expect(findAccount).toHaveBeenCalledWith({ identifier: 'ada' });
    expect(request).toHaveBeenCalledWith(
      'ada@example.com',
      'https://valence.example/reset-password',
    );
  });

  it('asks for nothing when no account answers to it', async () => {
    const request = vi.fn(() => Promise.resolve());
    const ask = createPasswordResetRequests({
      findAccount: () => Promise.resolve(null),
      request,
    });

    await ask({ identifier: 'nobody' }, 'https://valence.example/reset-password');

    expect(request).not.toHaveBeenCalled();
  });

  it('answers before the link is sent, so a real account takes no longer than a made-up one', async () => {
    const ask = createPasswordResetRequests({
      findAccount: () => Promise.resolve(ADA),
      request: () => new Promise<void>(() => undefined),
    });
    const answered = await Promise.race([
      ask({ identifier: 'ada' }, 'https://valence.example/reset-password').then(() => true),
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(false);
        }, 200);
      }),
    ]);

    expect(answered).toBe(true);
  });

  it('keeps a link that cannot be sent from failing the answer', async () => {
    const ask = createPasswordResetRequests({
      findAccount: () => Promise.resolve(ADA),
      request: () => Promise.reject(new Error('the mail server is down')),
    });

    await expect(
      ask({ identifier: 'ada' }, 'https://valence.example/reset-password'),
    ).resolves.toBeUndefined();
  });

  it('asks at most once a minute for one account', async () => {
    let at = 0;
    const request = vi.fn(() => Promise.resolve());
    const ask = createPasswordResetRequests({
      findAccount: () => Promise.resolve(ADA),
      request,
      now: () => at,
    });

    await ask({ identifier: 'ada' }, '/r');
    at = 30_000;
    await ask({ profileId: 'p1' }, '/r');

    expect(request).toHaveBeenCalledTimes(1);

    at = 61_000;
    await ask({ identifier: 'ada' }, '/r');

    expect(request).toHaveBeenCalledTimes(2);
  });
});
