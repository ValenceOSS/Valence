import { describe, expect, it } from 'vitest';
import { aCatalogueTitleDetail } from '@ValenceClient/testing/aCatalogueTitleDetail';
import { askingFor } from './askingFor';

describe('askingFor', () => {
  it('asks for a film by its TMDB id', () => {
    expect(askingFor(aCatalogueTitleDetail(), null, [])).toEqual({ kind: 'film', tmdbId: 438631 });
  });

  it('asks for a series with its seasons, following new ones unless told not to', () => {
    const series = aCatalogueTitleDetail({ kind: 'series', id: '95396' });

    expect(askingFor(series, [0, 1], [])).toEqual({
      kind: 'series',
      tmdbId: 95396,
      seasons: [0, 1],
      followsNewSeasons: true,
    });
    expect(askingFor(series, null, [], false)).toMatchObject({
      seasons: null,
      followsNewSeasons: false,
    });
  });

  it('asks for an artist by MusicBrainz id with the kinds of release chosen', () => {
    const artist = aCatalogueTitleDetail({ kind: 'artist', id: 'x', musicBrainzId: 'mb' });

    expect(askingFor(artist, null, ['album', 'ep'])).toEqual({
      kind: 'artist',
      musicBrainzId: 'mb',
      releaseTypes: ['album', 'ep'],
    });
  });

  it('asks for a book by its Open Library number, as an ebook unless told otherwise', () => {
    expect(askingFor(aCatalogueTitleDetail({ kind: 'book', id: '42' }), null, [])).toEqual({
      kind: 'book',
      openLibraryId: 42,
      bookFormats: ['ebook'],
    });
    expect(
      askingFor(aCatalogueTitleDetail({ kind: 'book', id: '42' }), null, [], true, [
        'ebook',
        'audiobook',
      ]),
    ).toMatchObject({ bookFormats: ['ebook', 'audiobook'] });
  });

  it("asks for every book of a book's series, where it has one and that's chosen", () => {
    const book = aCatalogueTitleDetail({
      kind: 'book',
      id: '42',
      series: { asin: 'B006K1RP8I', name: 'A Series', position: '1' },
    });

    expect(askingFor(book, null, [], true, ['audiobook'], true)).toEqual({
      kind: 'bookSeries',
      seriesAsin: 'B006K1RP8I',
      bookFormats: ['audiobook'],
    });
    expect(
      askingFor(aCatalogueTitleDetail({ kind: 'book', id: '42' }), null, [], true, ['ebook'], true),
    ).toMatchObject({ kind: 'book' });
  });
});
