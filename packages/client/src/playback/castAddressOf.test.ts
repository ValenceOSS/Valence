import { afterEach, describe, expect, it, vi } from 'vitest';
import { castAddressOf } from '@ValenceClient/playback/castAddressOf';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('castAddressOf', () => {
  it('asks for the session’s ticketed address', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(Response.json({ manifestUrl: '/api/playback/cast/t/index.m3u8' })),
    );

    vi.stubGlobal('fetch', fetchMock);

    expect(await castAddressOf('abc')).toBe('/api/playback/cast/t/index.m3u8');
    expect(fetchMock).toHaveBeenCalledWith('/api/playback/session/abc/cast', { method: 'POST' });
  });

  it('answers nothing where the server refuses or cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 403 })));
    expect(await castAddressOf('abc')).toBeNull();

    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    expect(await castAddressOf('abc')).toBeNull();
  });
});
