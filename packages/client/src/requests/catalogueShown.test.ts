import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { catalogueShown } from './catalogueShown';
import type { CatalogueView } from '@ValenceClient/requests/CatalogueView.types';

const VIEW: CatalogueView = {
  tab: 'films',
  libraryId: null,
  status: 'all',
  kind: 'all',
  query: '',
  sort: 'recent',
};

describe('catalogueShown', () => {
  it('shows a tab’s titles, newest first', () => {
    const older = aCatalogueEntry({ key: 'a', addedAt: '2026-01-01T00:00:00.000Z' });
    const newer = aCatalogueEntry({ key: 'b', addedAt: '2026-02-01T00:00:00.000Z' });
    const show = aCatalogueEntry({ key: 'c', tab: 'shows', kind: 'series' });

    expect(catalogueShown([older, newer, show], VIEW).map((one) => one.key)).toEqual(['b', 'a']);
  });

  it('narrows to one library', () => {
    const here = aCatalogueEntry({ key: 'here', libraryId: 'films-4k' });
    const there = aCatalogueEntry({ key: 'there', libraryId: 'films' });

    expect(
      catalogueShown([here, there], { ...VIEW, libraryId: 'films-4k' }).map((one) => one.key),
    ).toEqual(['here']);
  });

  it('sorts by title where asked', () => {
    const zed = aCatalogueEntry({ key: 'z', title: 'Zed' });
    const ay = aCatalogueEntry({ key: 'a', title: 'Ay' });

    expect(catalogueShown([zed, ay], { ...VIEW, sort: 'title' }).map((one) => one.key)).toEqual([
      'a',
      'z',
    ]);
  });

  it('narrows to a status, a kind, and the words looked for', () => {
    const entries = [
      aCatalogueEntry({ key: 'artist', tab: 'music', kind: 'artist', title: 'Band' }),
      aCatalogueEntry({
        key: 'album',
        tab: 'music',
        kind: 'album',
        title: 'Record',
        subtitle: 'Band',
        status: 'missing',
      }),
      aCatalogueEntry({ key: 'ebook', tab: 'books', kind: 'book' }),
      aCatalogueEntry({ key: 'audio', tab: 'books', kind: 'book', isAudio: true }),
    ];

    expect(
      catalogueShown(entries, { ...VIEW, tab: 'music', status: 'missing' }).map((one) => one.key),
    ).toEqual(['album']);
    expect(
      catalogueShown(entries, { ...VIEW, tab: 'music', kind: 'artist' }).map((one) => one.key),
    ).toEqual(['artist']);
    expect(
      catalogueShown(entries, { ...VIEW, tab: 'music', query: ' band ' }).map((one) => one.key),
    ).toEqual(['artist', 'album']);
    expect(
      catalogueShown(entries, { ...VIEW, tab: 'books', kind: 'audiobook' }).map((one) => one.key),
    ).toEqual(['audio']);
    expect(
      catalogueShown(entries, { ...VIEW, tab: 'books', kind: 'ebook' }).map((one) => one.key),
    ).toEqual(['ebook']);
  });
});
