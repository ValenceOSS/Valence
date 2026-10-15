import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveAccountStreamLimit } from './saveAccountStreamLimit';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveAccountStreamLimit', () => {
  it('sends the limit and reads back where it now stands', async () => {
    const limit = { maxBitrateKbps: 8000, maxStreams: 2 };
    const answer = { own: limit, effective: limit, streamsNow: 0 };
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(answer))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(saveAccountStreamLimit('ada', limit)).resolves.toEqual(answer);
    expect(fetch.mock.calls[0]?.[0]).toBe('/api/admin/accounts/ada/stream-limit');
    expect(fetch.mock.calls[0]?.[1].body).toBe(JSON.stringify(limit));
  });

  it('answers nothing where it could not be saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 403 }))),
    );

    await expect(
      saveAccountStreamLimit('ada', { maxBitrateKbps: null, maxStreams: null }),
    ).resolves.toBeNull();
  });
});
