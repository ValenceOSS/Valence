import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { fetchPreTranscoding } from './fetchPreTranscoding';

const status = {
  settings: PRE_TRANSCODING_DEFAULTS,
  copiesMade: 2,
  stillNeeded: 40,
  givenUp: 1,
  ladder: [],
  current: null,
  isInWindow: false,
  timezone: 'Europe/London',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPreTranscoding', () => {
  it('reads the settings and how far it has got', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(status)));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchPreTranscoding()).resolves.toEqual(status);
    expect(fetching).toHaveBeenCalledWith('/api/pre-transcoding', expect.anything());
  });

  it('throws where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(fetchPreTranscoding()).rejects.toThrow();
  });
});
