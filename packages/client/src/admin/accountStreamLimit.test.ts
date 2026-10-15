import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountStreamLimit } from './accountStreamLimit';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('accountStreamLimit', () => {
  it('reads an account’s limits and its streams now', async () => {
    const answer = {
      own: { maxBitrateKbps: 8000, maxStreams: null },
      effective: { maxBitrateKbps: 8000, maxStreams: 1 },
      streamsNow: 2,
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(answer)))),
    );

    await expect(accountStreamLimit('ada')).resolves.toEqual(answer);
  });
});
