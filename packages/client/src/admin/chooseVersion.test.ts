import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseVersion } from './chooseVersion';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('chooseVersion', () => {
  it('puts the choice for the version', async () => {
    const fetching = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

    vi.stubGlobal('fetch', fetching);

    await expect(chooseVersion('cut', { isStanding: true })).resolves.toBeNull();
    expect(fetching).toHaveBeenCalledWith('/api/media/cut/version', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isStanding: true }),
    });
  });

  it('passes on why it was refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'No.' }), { status: 400 }))),
    );

    await expect(chooseVersion('cut', { label: 'x' })).resolves.toEqual({ problem: 'No.' });
  });
});
