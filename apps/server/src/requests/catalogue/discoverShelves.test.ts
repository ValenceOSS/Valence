import { describe, expect, it, vi } from 'vitest';
import { discoverShelves } from './discoverShelves';
import type { ShelfSources } from './discoverShelves';

/**
 * Sources that list one title everywhere, and chart one album and one artist.
 */
const sources = () => {
  const given = {
    browse: vi.fn<ShelfSources['browse']>(({ list, kind }) =>
      Promise.resolve({
        matches:
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
        hasMore: true,
      }),
    ),
    studios: vi.fn<ShelfSources['studios']>(() =>
      Promise.resolve([{ id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://p/d.png' }]),
    ),
    charts: vi.fn<ShelfSources['charts']>(() =>
      Promise.resolve({
        albums: [{ deezerId: 7, title: 'Pylon', artist: 'Band', coverUrl: null }],
        artists: [{ deezerId: 2, name: 'Taylor Swift', pictureUrl: null }],
      }),
    ),
    bookShelves: vi.fn<ShelfSources['bookShelves']>(() =>
      Promise.resolve([
        {
          id: 'trending-books',
          title: 'Trending books',
          books: [
            {
              openLibraryId: 21_277_329,
              title: 'Project Hail Mary',
              author: 'Andy Weir',
              year: 2021,
              coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
            },
          ],
        },
        { id: 'empty-books', title: 'Nothing', books: [] },
      ]),
    ),
  };

  return given satisfies ShelfSources;
};

describe('discoverShelves', () => {
  it('shelves films, series and music for somebody who may ask for them all', async () => {
    const { shelves, studios } = await discoverShelves(sources(), {
      video: true,
      music: true,
      books: false,
    });

    expect(studios).toEqual([
      { id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://p/d.png' },
    ]);
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
    expect(shelves[1]?.browse).toEqual({ kind: 'series', list: 'trending', studio: null });
    expect(shelves[5]?.browse).toBeNull();
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
    const { shelves, studios } = await discoverShelves(asked, {
      video: false,
      music: true,
      books: false,
    });

    expect(shelves.map((shelf) => shelf.id)).toEqual(['popular-albums', 'popular-artists']);
    expect(studios).toEqual([]);
    expect(asked.browse).not.toHaveBeenCalled();
    expect(asked.studios).not.toHaveBeenCalled();

    const films = sources();

    await discoverShelves(films, { video: true, music: false, books: false });

    expect(films.charts).not.toHaveBeenCalled();
  });

  it('shelves books for somebody who may ask for them, each by its Open Library number', async () => {
    const { shelves } = await discoverShelves(sources(), {
      video: false,
      music: false,
      books: true,
    });

    expect(shelves.map((shelf) => shelf.id)).toEqual(['trending-books']);
    expect(shelves[0]?.browse).toBeNull();
    expect(shelves[0]?.titles[0]).toEqual({
      kind: 'book',
      id: '21277329',
      title: 'Project Hail Mary',
      subtitle: 'Andy Weir',
      year: 2021,
      overview: null,
      posterUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
    });
  });

  it('asks Open Library for nothing where books may not be asked for', async () => {
    const asked = sources();

    await discoverShelves(asked, { video: true, music: true, books: false });

    expect(asked.bookShelves).not.toHaveBeenCalled();
  });
});
