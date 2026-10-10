import { describe, expect, it } from 'vitest';
import { standTitles } from './standTitles';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueLookup } from './CatalogueLookup';

/**
 * A library holding what it is given, and nothing else.
 */
const aLookup = (
  holds: Partial<Record<keyof CatalogueLookup, Record<string, string>>> = {},
): CatalogueLookup => {
  const held = (name: Exclude<keyof CatalogueLookup, 'booksNamed'>) => (keys: readonly string[]) =>
    Promise.resolve(
      new Map(
        keys.flatMap((key) => {
          const found = holds[name]?.[key];

          return found === undefined ? [] : [[key, found] as const];
        }),
      ),
    );

  return {
    films: held('films'),
    series: held('series'),
    episodesHeld: () => Promise.resolve(new Map<number, number>()),
    seriesFiles: () => Promise.resolve([]),
    heldTitles: () => Promise.resolve([]),
    titleFiles: () => Promise.resolve({ folder: null, files: [] }),
    elsewhere: () => Promise.resolve(new Map()),
    filmIn: () => Promise.resolve(null),
    artists: held('artists'),
    albums: held('albums'),
    albumQualities: () => Promise.resolve(new Map()),
    seriesNarrators: () => Promise.resolve([]),
    artistsNamed: held('artistsNamed'),
    albumsNamed: held('albumsNamed'),
    booksNamed: (books) =>
      Promise.resolve(
        new Map(
          books.flatMap(({ key }) => {
            const found = holds.booksNamed?.[key];

            return found === undefined ? [] : [[key, found] as const];
          }),
        ),
      ),
  };
};

/**
 * A title to stand, of the kind and id given.
 */
const aTitle = (
  kind: 'film' | 'series' | 'artist' | 'album' | 'book',
  id: string,
  title = 'Dune',
) => ({
  kind,
  id,
  title,
  subtitle: kind === 'album' ? 'Pink Floyd' : kind === 'book' ? 'Frank Herbert' : null,
  year: null,
  overview: null,
  posterUrl: null,
});

/**
 * A request for something.
 */
const aRequest = (overrides: Partial<MediaRequest>): MediaRequest => ({
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  kind: 'film',
  tmdbId: 438631,
  musicBrainzId: null,
  openLibraryId: null,
  title: 'Dune',
  artistName: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  libraryId: 'films',
  profileId: null,
  profileName: null,
  isPickedByHand: false,
  state: 'downloading',
  problem: null,
  problemCode: null,
  approval: 'approved',
  refusedBecause: null,
  requestedBy: { id: 'someone', name: 'Sam' },
  alsoAskedBy: [],
  origin: 'asked',
  isFollowed: false,
  profileAsk: null,
  seasons: null,
  followsNewSeasons: false,
  releaseTypes: null,
  releaseDate: null,
  releaseDates: { theatrical: null, digital: null, physical: null },
  items: [],
  mediaId: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

describe('standTitles', () => {
  it('says what is in the library, what is asked for, and what is there to ask for', async () => {
    const stood = await standTitles(
      [aTitle('film', '438631'), aTitle('series', '95396'), aTitle('film', '1')],
      aLookup({ series: { '95396': 'show-1' } }),
      [aRequest({})],
    );

    expect(stood.map((title) => title.standing)).toEqual([
      {
        status: 'requested',
        mediaId: null,
        requestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        requestState: 'downloading',
        askedBy: [{ id: 'someone', name: 'Sam' }],
      },
      { status: 'library', mediaId: 'show-1', requestId: null, requestState: null },
      { status: 'askable', mediaId: null, requestId: null, requestState: null },
    ]);
  });

  it('knows music by its MusicBrainz id, and music from the charts by its name', async () => {
    const stood = await standTitles(
      [
        aTitle('artist', '83d91898-7763-47d7-b03b-b92132375c47', 'Pink Floyd'),
        aTitle('album', 'deezer-7', 'The Wall'),
        aTitle('artist', 'deezer-2', 'Björk'),
      ],
      aLookup({
        artists: { '83d91898-7763-47d7-b03b-b92132375c47': 'artist-1' },
        albumsNamed: { 'pink floyd/the wall': 'album-1' },
      }),
      [
        aRequest({
          kind: 'artist',
          tmdbId: null,
          musicBrainzId: 'b1',
          title: 'björk',
          state: 'wanted',
        }),
      ],
    );

    expect(stood.map((title) => [title.standing.status, title.standing.mediaId])).toEqual([
      ['library', 'artist-1'],
      ['library', 'album-1'],
      ['requested', null],
    ]);
  });

  it('knows a book by its Open Library number when asked for, and by its author and title when held', async () => {
    const stood = await standTitles(
      [
        aTitle('book', '21277329', 'Project Hail Mary'),
        aTitle('book', '893', 'Dune'),
        aTitle('book', '5', 'Emma'),
      ],
      aLookup({ booksNamed: { 'frank herbert/dune': 'book-1' } }),
      [
        aRequest({
          kind: 'book',
          tmdbId: null,
          openLibraryId: 21_277_329,
          title: 'Project Hail Mary',
          state: 'wanted',
        }),
      ],
    );

    expect(stood.map((title) => [title.standing.status, title.standing.mediaId])).toEqual([
      ['requested', null],
      ['library', 'book-1'],
      ['askable', null],
    ]);
  });

  it('does not take a film for a book that shares its number', async () => {
    const [stood] = await standTitles([aTitle('book', '438631', 'Dune')], aLookup(), [
      aRequest({}),
    ]);

    expect(stood?.standing.status).toBe('askable');
  });

  it('asks the library nothing it has no ids for', async () => {
    expect(await standTitles([], aLookup(), [])).toEqual([]);
  });

  it('says which linked server has a film or a programme, and how a request for it here is going', async () => {
    const lookup: CatalogueLookup = {
      ...aLookup(),
      elsewhere: (keys) =>
        Promise.resolve(
          new Map(
            keys
              .filter((key) => key === '438631' || key === '95396')
              .map((key) => [key, { mediaId: `there-${key}`, fromServer: 'Films' }] as const),
          ),
        ),
    };
    const stood = await standTitles(
      [aTitle('film', '438631'), aTitle('series', '95396'), aTitle('film', '1')],
      lookup,
      [aRequest({})],
    );

    expect(stood.map((title) => title.standing)).toEqual([
      {
        status: 'linked',
        mediaId: 'there-438631',
        requestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        requestState: 'downloading',
        fromServer: 'Films',
        askedBy: [{ id: 'someone', name: 'Sam' }],
      },
      {
        status: 'linked',
        mediaId: 'there-95396',
        requestId: null,
        requestState: null,
        fromServer: 'Films',
      },
      { status: 'askable', mediaId: null, requestId: null, requestState: null },
    ]);
  });

  it('says a title held here is in the library, even where a linked server has it too', async () => {
    const stood = await standTitles(
      [aTitle('film', '438631')],
      {
        ...aLookup({ films: { '438631': 'here-1' } }),
        elsewhere: () =>
          Promise.resolve(new Map([['438631', { mediaId: 'there', fromServer: 'Films' }]])),
      },
      [],
    );

    expect(stood[0]?.standing.status).toBe('library');
  });
});
