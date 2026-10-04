import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetPassword } from './resetPassword';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resetPassword', () => {
  it('sets the new password with the token from the link', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: true })));

    vi.stubGlobal('fetch', fetching);

    await expect(resetPassword('tok', 'a long new password')).resolves.toEqual({
      kind: 'changed',
    });
    expect(fetching).toHaveBeenCalledWith(
      '/api/auth/reset-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'tok', newPassword: 'a long new password' }),
      }),
    );
  });

  it('says why not where the link has gone stale or the server is away', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(resetPassword('tok', 'x')).resolves.toEqual({
      kind: 'refused',
      reason: 'That link has expired or has already been used. Request a new one.',
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(resetPassword('tok', 'x')).resolves.toMatchObject({ kind: 'refused' });
  });
});
