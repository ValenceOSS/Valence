import { afterEach, describe, expect, it, vi } from 'vitest';
import { roleStreamLimit } from './roleStreamLimit';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('roleStreamLimit', () => {
  it('reads the limit a role carries', async () => {
    const limit = { maxBitrateKbps: 4000, maxStreams: 1 };

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(limit)))),
    );

    await expect(roleStreamLimit('kids')).resolves.toEqual(limit);
  });
});
