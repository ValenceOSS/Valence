import { describe, expect, it } from 'vitest';
import {
  MediaRequestAskSchema,
  MediaRequestDraftSchema,
  RequestCatalogueSchema,
} from './MediaRequest';

describe('MediaRequestAskSchema', () => {
  it('asks for every season, and whatever comes later, unless told otherwise', () => {
    expect(MediaRequestAskSchema.parse({ kind: 'series', tmdbId: 1399 })).toEqual({
      kind: 'series',
      tmdbId: 1399,
      seasons: null,
      followsNewSeasons: true,
      isPickedByHand: false,
      origin: 'asked',
    });
  });

  it('follows a title rather than asking for it where told to', () => {
    expect(
      MediaRequestAskSchema.parse({ kind: 'film', tmdbId: 1, origin: 'monitored' }).origin,
    ).toBe('monitored');
  });

  it('refuses something that is not a film, a series, an artist or an album', () => {
    expect(() => MediaRequestAskSchema.parse({ kind: 'book', tmdbId: 1 })).toThrow();
  });

  it('asks for music by its MusicBrainz id, and films and series by their TMDB one', () => {
    expect(
      MediaRequestAskSchema.parse({
        kind: 'artist',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        releaseTypes: ['album', 'ep'],
      }),
    ).toMatchObject({ kind: 'artist', releaseTypes: ['album', 'ep'] });
    expect(() => MediaRequestAskSchema.parse({ kind: 'album', tmdbId: 1 })).toThrow(
      /MusicBrainz ID/,
    );
    expect(() =>
      MediaRequestAskSchema.parse({
        kind: 'film',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
      }),
    ).toThrow(/TMDB ID/);
  });

  it('refuses an artist watched for no kind of release', () => {
    expect(() =>
      MediaRequestAskSchema.parse({
        kind: 'artist',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        releaseTypes: [],
      }),
    ).toThrow();
  });

  it('refuses a book asked for in the same format twice', () => {
    expect(() =>
      MediaRequestAskSchema.parse({
        kind: 'book',
        openLibraryId: 21_277_329,
        bookFormats: ['ebook', 'ebook'],
      }),
    ).toThrow();
  });
});

describe('RequestCatalogueSchema', () => {
  it('fills in what the catalogue did not say', () => {
    expect(RequestCatalogueSchema.parse({ title: 'Dune', year: 2021 })).toEqual({
      title: 'Dune',
      year: 2021,
      aliases: [],
      overview: null,
      posterUrl: null,
      runtimeMinutes: null,
      releaseDates: { theatrical: null, digital: null, physical: null },
      episodes: [],
      isEnded: false,
      artist: null,
      albums: [],
    });
  });

  it('refuses a date that is not a calendar date', () => {
    expect(() =>
      RequestCatalogueSchema.parse({
        title: 'Dune',
        year: 2021,
        releaseDates: { theatrical: '21 October', digital: null, physical: null },
      }),
    ).toThrow();
  });
});

describe('MediaRequestDraftSchema', () => {
  it('carries who asked, and whether it needs approving', () => {
    const draft = MediaRequestDraftSchema.parse({
      kind: 'film',
      tmdbId: 438631,
      libraryId: 'films',
      libraryPath: '/media/Films',
      requestedBy: { id: 'someone', name: 'Someone' },
      isApproved: false,
      catalogue: { title: 'Dune', year: 2021 },
    });

    expect(draft.isApproved).toBe(false);
    expect(draft.requestedBy.name).toBe('Someone');
  });
});
