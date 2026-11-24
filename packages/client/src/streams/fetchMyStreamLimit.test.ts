import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMyStreamLimit } from './fetchMyStreamLimit';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchMyStreamLimit', () => {
  it('reads the limit the account signed in streams under', async () => {
    const limit = {
      maxBitrateKbps: 8000,
      maxStreams: 2,
      maxQuality: '720p',
      limitsDownloads: true,
    };

    fetchMock.mockResolvedValue(new Response(JSON.stringify(limit)));

    await expect(fetchMyStreamLimit()).resolves.toEqual(limit);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/account/stream-limit');
  });

  it('leaves open whatever the server does not set', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ maxStreams: 1 })));

    await expect(fetchMyStreamLimit()).resolves.toEqual({
      maxBitrateKbps: null,
      maxStreams: 1,
      maxQuality: null,
      limitsDownloads: false,
    });
  });

  it('refuses a quality that is not a step rather than guessing at it', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ maxQuality: '900p' })));

    await expect(fetchMyStreamLimit()).rejects.toThrow();
  });

  it('says so when the server refuses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'no' }), { status: 401 }));

    await expect(fetchMyStreamLimit()).rejects.toThrow();
  });
});
