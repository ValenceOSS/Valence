import { describe, expect, it, vi } from 'vitest';
import { discoverShelves } from './discoverShelves';
import type { ShelfSources } from './discoverShelves';

/**
 * Sources that list one title everywhere, and chart one album and one artist.
 */
const sources = () => {
  const given = {
    discover: vi.fn<ShelfSources['discover']>((list, kind) =>
      Promise.resolve(
        list === 'upcoming' && kind === 'tv'
          ? []
          : [
              {
                externalId: '438631',
                kind,
                title: 'Dune',
                year: 2021,
                overview: null,
                posterUrl: null,
              },
            ],
      ),
    ),
    charts: vi.fn<ShelfSources['charts']>(() =>
      Promise.resolve({
        albums: [{ deezerId: 7, title: 'Pylon', artist: 'Band', coverUrl: null }],
        artists: [{ deezerId: 2, name: 'Taylor Swift', pictureUrl: null }],
      }),
    ),
  };

  return given satisfies ShelfSources;
};

describe('discoverShelves', () => {
  it('shelves films, series and music for somebody who may ask for them all', async () => {
    const shelves = await discoverShelves(sources(), { video: true, music: true });

    expect(shelves.map((shelf) => shelf.id)).toEqual([
      'trending-films',
      'trending-series',
      'popular-films',
      'popular-series',
      'coming-films',
      'popular-albums',
      'popular-artists',
    ]);
    expect(shelves[1]?.titles[0]).toMatchObject({ kind: 'series', id: '438631' });
    expect(shelves[5]?.titles[0]).toEqual({
      kind: 'album',
      id: 'deezer-7',
      title: 'Pylon',
      subtitle: 'Band',
      year: null,
      overview: null,
      posterUrl: null,
    });
  });

  it('shelves only what somebody may ask for, asking nothing more', async () => {
    const asked = sources();
    const shelves = await discoverShelves(asked, { video: false, music: true });

    expect(shelves.map((shelf) => shelf.id)).toEqual(['popular-albums', 'popular-artists']);
    expect(asked.discover).not.toHaveBeenCalled();

    const films = sources();

    await discoverShelves(films, { video: true, music: false });

    expect(films.charts).not.toHaveBeenCalled();
  });
});
