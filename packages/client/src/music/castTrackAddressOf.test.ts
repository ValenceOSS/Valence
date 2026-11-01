import { afterEach, describe, expect, it, vi } from 'vitest';
import { castTrackAddressOf } from '@ValenceClient/music/castTrackAddressOf';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('castTrackAddressOf', () => {
  it('asks for the track’s ticketed address at the quality it plays at', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({ address: '/api/music/cast/t' })));

    vi.stubGlobal('fetch', fetchMock);

    expect(await castTrackAddressOf('song', 'high')).toBe('/api/music/cast/t');
    expect(fetchMock).toHaveBeenCalledWith('/api/music/tracks/song/cast?quality=high', {
      method: 'POST',
    });
  });

  it('answers nothing where the server refuses or cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 404 })));
    expect(await castTrackAddressOf('song', 'high')).toBeNull();

    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    expect(await castTrackAddressOf('song', 'high')).toBeNull();
  });
});
