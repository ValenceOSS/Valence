import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveFanartKey } from './saveFanartKey';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveFanartKey', () => {
  it('patches the settings with the key, saying whether it was written', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(null, { status: 204 })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(saveFanartKey('a-key')).resolves.toBe(true);
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ fanartKey: 'a-key' }),
    });
  });
});
