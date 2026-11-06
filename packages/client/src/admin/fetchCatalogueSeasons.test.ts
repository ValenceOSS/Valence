import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCatalogueSeasons } from './fetchCatalogueSeasons';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCatalogueSeasons', () => {
  it('reads the seasons another show has', async () => {
    const seasons = {
      seasons: [{ seasonNumber: 1, name: null, episodeCount: 6, airDate: '2026-09-04' }],
    };
    const fetching = vi.fn((_url: string) =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(seasons) }),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(fetchCatalogueSeasons('file', '900')).resolves.toEqual(seasons);
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/media/file/season-source/seasons?show=900');
  });
});
