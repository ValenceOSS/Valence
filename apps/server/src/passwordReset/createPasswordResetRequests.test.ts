import { describe, expect, it, vi } from 'vitest';
import { createPasswordResetRequests } from './createPasswordResetRequests';

const ADA = { userId: 'u1', email: 'ada@example.com' };

describe('createPasswordResetRequests', () => {
  it('asks for a reset for the account found, by what was typed, trimmed', async () => {
    const findAccount = vi.fn(() => Promise.resolve(ADA));
    const request = vi.fn(() => Promise.resolve());
    const ask = createPasswordResetRequests({ findAccount, request });

    await ask('  ada  ', 'https://valence.example/reset-password');

    expect(findAccount).toHaveBeenCalledWith('ada');
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

    await ask('nobody', 'https://valence.example/reset-password');

    expect(request).not.toHaveBeenCalled();
  });

  it('asks at most once a minute for one account', async () => {
    let at = 0;
    const request = vi.fn(() => Promise.resolve());
    const ask = createPasswordResetRequests({
      findAccount: () => Promise.resolve(ADA),
      request,
      now: () => at,
    });

    await ask('ada', '/r');
    at = 30_000;
    await ask('ada@example.com', '/r');

    expect(request).toHaveBeenCalledTimes(1);

    at = 61_000;
    await ask('ada', '/r');

    expect(request).toHaveBeenCalledTimes(2);
  });
});
