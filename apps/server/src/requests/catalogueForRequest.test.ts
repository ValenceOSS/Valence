import { describe, expect, it, vi } from 'vitest';
import { catalogueForRequest } from './catalogueForRequest';
import type { CatalogueSources } from './catalogueForRequest';

const FACTS = { title: 'Found', year: null };

/**
 * Catalogues that know everything.
 */
const sources = () => {
  const given = {
    describeForRequest: vi.fn<CatalogueSources['describeForRequest']>(() =>
      Promise.resolve({
        ...FACTS,
        aliases: [],
        overview: null,
        posterUrl: null,
        runtimeMinutes: null,
        releaseDates: { theatrical: null, digital: null, physical: null },
        episodes: [],
        isEnded: false,
        artist: null,
        albums: [],
      }),
    ),
    describeMusicForRequest: vi.fn<CatalogueSources['describeMusicForRequest']>(() =>
      Promise.resolve(null),
    ),
    describeBookForRequest: vi.fn<CatalogueSources['describeBookForRequest']>(() =>
      Promise.resolve(null),
    ),
  };

  return given satisfies CatalogueSources;
};

describe('catalogueForRequest', () => {
  it('asks TMDB of films and series, and MusicBrainz of artists and albums', async () => {
    const asked = sources();

    await catalogueForRequest(asked, { kind: 'series', tmdbId: 95396 });
    await catalogueForRequest(asked, { kind: 'album', musicBrainzId: 'wall' });

    expect(asked.describeForRequest).toHaveBeenCalledWith(95396, 'series');
    expect(asked.describeMusicForRequest).toHaveBeenCalledWith('wall', 'album');
  });

  it('asks nothing where the id its kind is found by is missing', async () => {
    const asked = sources();

    expect(await catalogueForRequest(asked, { kind: 'film', musicBrainzId: 'wall' })).toBeNull();
    expect(await catalogueForRequest(asked, { kind: 'artist', tmdbId: 1 })).toBeNull();
    expect(await catalogueForRequest(asked, { kind: 'book', tmdbId: 1 })).toBeNull();
    expect(asked.describeForRequest).not.toHaveBeenCalled();
    expect(asked.describeMusicForRequest).not.toHaveBeenCalled();
    expect(asked.describeBookForRequest).not.toHaveBeenCalled();
  });

  it('asks Open Library of a book, by its Open Library id', async () => {
    const asked = sources();

    await catalogueForRequest(asked, { kind: 'book', openLibraryId: 21_277_329 });

    expect(asked.describeBookForRequest).toHaveBeenCalledWith(21_277_329);
    expect(asked.describeForRequest).not.toHaveBeenCalled();
  });
});
