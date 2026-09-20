import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAppearance } from './fetchAppearance';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAppearance', () => {
  it('reads how round the server says everything should be', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ roundness: 'round' }))),
    );

    await expect(fetchAppearance()).resolves.toEqual({ roundness: 'round' });
  });

  it('asks the server it is pointed at, for the one address', async () => {
    const asked = vi.fn<(address: string) => Promise<Response>>(() =>
      Promise.resolve(Response.json({ roundness: 'soft' })),
    );

    vi.stubGlobal('fetch', asked);

    await fetchAppearance();

    expect(asked.mock.calls[0]?.[0]).toContain('/api/appearance');
  });
});
