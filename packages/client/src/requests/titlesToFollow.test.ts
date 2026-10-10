import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { titlesToFollow } from './titlesToFollow';

const TAKING = new Set(['films', 'shows', 'music']);

describe('titlesToFollow', () => {
  it('follows what the libraries hold that nothing follows yet', () => {
    const film = aCatalogueEntry({ key: 'film' });
    const show = aCatalogueEntry({
      key: 'show',
      tab: 'shows',
      kind: 'series',
      libraryId: 'shows',
    });
    const followed = aCatalogueEntry({ key: 'followed', status: 'library' });

    expect(titlesToFollow([film, show, followed], TAKING).titles).toEqual([film, show]);
  });

  it('leaves out books and titles known by no catalogue id', () => {
    const book = aCatalogueEntry({ key: 'book', tab: 'books', kind: 'book', catalogueId: 'OL1W' });
    const unknown = aCatalogueEntry({ key: 'unknown', catalogueId: null });

    expect(titlesToFollow([book, unknown], TAKING).titles).toEqual([]);
  });

  it('leaves an album to its artist where the artist is listed too', () => {
    const artist = aCatalogueEntry({
      key: 'artist',
      tab: 'music',
      kind: 'artist',
      catalogueId: 'mb-artist',
      title: 'Some Band',
      libraryId: 'music',
    });
    const theirs = aCatalogueEntry({
      key: 'theirs',
      tab: 'music',
      kind: 'album',
      catalogueId: 'mb-1',
      subtitle: 'some band',
      libraryId: 'music',
    });
    const loose = aCatalogueEntry({
      key: 'loose',
      tab: 'music',
      kind: 'album',
      catalogueId: 'mb-2',
      subtitle: 'Nobody Listed',
      libraryId: 'music',
    });

    expect(titlesToFollow([artist, theirs, loose], TAKING).titles).toEqual([artist, loose]);
  });

  it('counts, rather than follows, what sits in a library that takes no requests', () => {
    const elsewhere = aCatalogueEntry({ key: 'elsewhere', libraryId: 'archive' });

    expect(titlesToFollow([elsewhere], TAKING)).toEqual({ titles: [], elsewhere: 1 });
  });
});
