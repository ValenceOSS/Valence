import { describe, expect, it, vi } from 'vitest';
import { createFanartProvider } from './createFanartProvider';

const IMAGE = (url: string, likes: string, lang = 'en') => ({ id: '1', url, lang, likes });

describe('createFanartProvider', () => {
  it('offers a film’s posters, backgrounds and logos, the most liked first', async () => {
    const fetchImpl = vi.fn((_url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            movieposter: [
              IMAGE('https://assets.fanart.tv/fanart/movies/1/movieposter/a.jpg', '1'),
              IMAGE('https://assets.fanart.tv/fanart/movies/1/movieposter/b.jpg', '9', '00'),
            ],
            hdmovielogo: [IMAGE('https://assets.fanart.tv/fanart/movies/1/hdmovielogo/c.png', '2')],
          }),
      }),
    );
    const provider = createFanartProvider({
      readApiKey: () => Promise.resolve('a-key'),
      fetchImpl,
    });
    const options = await provider.readArtworkOptions?.({ externalId: '1', isSeries: false });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'https://webservice.fanart.tv/v3/movies/1?api_key=a-key',
    );
    expect(options?.poster.map((one) => [one.votes, one.language])).toEqual([
      [9, null],
      [1, 'en'],
    ]);
    expect(options?.poster[0]?.previewUrl).toBe(
      'https://assets.fanart.tv/preview/movies/1/movieposter/b.jpg',
    );
    expect(options?.backdrop).toEqual([]);
    expect(options?.logo).toHaveLength(1);
  });

  it('asks nothing without a key, or for a show it has no TVDB id for', async () => {
    const fetchImpl = vi.fn();
    const keyless = createFanartProvider({ readApiKey: () => Promise.resolve(''), fetchImpl });
    const keyed = createFanartProvider({ readApiKey: () => Promise.resolve('k'), fetchImpl });

    await expect(
      keyless.readArtworkOptions?.({ externalId: '1', isSeries: false }),
    ).resolves.toBeNull();
    await expect(
      keyed.readArtworkOptions?.({ externalId: '1', isSeries: true, tvdbId: null }),
    ).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
