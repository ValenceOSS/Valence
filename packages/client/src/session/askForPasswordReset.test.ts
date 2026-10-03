import { afterEach, describe, expect, it, vi } from 'vitest';
import { askForPasswordReset } from './askForPasswordReset';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askForPasswordReset', () => {
  it('posts what was typed and where the link should lead', async () => {
    const fetching = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ requested: true }), { status: 202 }));

    vi.stubGlobal('fetch', fetching);

    await expect(
      askForPasswordReset({ identifier: 'ada' }, 'https://v.example/reset-password'),
    ).resolves.toBe(true);
    expect(fetching).toHaveBeenCalledWith(
      '/api/password-reset',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'ada', redirectTo: 'https://v.example/reset-password' }),
      }),
    );
  });

  it('says no where the server could not be reached or refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(askForPasswordReset({ identifier: 'ada' }, '/r')).resolves.toBe(false);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(askForPasswordReset({ identifier: 'ada' }, '/r')).resolves.toBe(false);
  });
});
