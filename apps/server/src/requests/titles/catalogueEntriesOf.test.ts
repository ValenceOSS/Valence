import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { aShownRequestItem } from '@ValenceServer/testing/aShownRequestItem';
import { catalogueEntriesOf } from './catalogueEntriesOf';
import type { HeldTitle } from '@ValenceServer/requests/titles/HeldTitle';

/**
 * A film the films library holds, with anything a test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The title.
 */
const aHeldTitle = (overrides: Partial<HeldTitle> = {}): HeldTitle => ({
  kind: 'film',
  id: 'film-1',
  libraryId: 'films',
  catalogueId: '438631',
  title: 'Film',
  subtitle: null,
  year: 2021,
  art: { kind: 'media', id: 'film-1' },
  held: 1,
  isAudio: false,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('catalogueEntriesOf', () => {
  it('lists a title held but never asked for as not followed', () => {
    expect(catalogueEntriesOf([aHeldTitle()], [])).toEqual([
      expect.objectContaining({
        key: 'film:438631',
        tab: 'films',
        status: 'notFollowed',
        held: 1,
        total: 1,
        mediaId: 'film-1',
        requestId: null,
      }),
    ]);
  });

  it('joins a request to the title it is for, by its catalogue id', () => {
    const request = aShownRequest({ items: [aShownRequestItem({ state: 'available' })] });
    const [entry] = catalogueEntriesOf([aHeldTitle()], [request]);

    expect(entry).toMatchObject({
      status: 'library',
      requestId: request.id,
      askedBy: { name: 'Sam' },
      art: { kind: 'media', id: 'film-1' },
    });
  });

  it('lists what is asked for and not yet held, with where it stands', () => {
    const states = [
      [aShownRequest({ approval: 'awaiting' }), 'toApprove'],
      [aShownRequest({ items: [aShownRequestItem({ state: 'failed' })] }), 'failed'],
      [aShownRequest({ items: [aShownRequestItem({ state: 'downloading' })] }), 'downloading'],
      [aShownRequest({ items: [aShownRequestItem({ state: 'wanted' })] }), 'missing'],
      [aShownRequest({ items: [aShownRequestItem({ state: 'waiting' })] }), 'missing'],
    ] as const;

    for (const [request, status] of states) {
      expect(catalogueEntriesOf([], [request])).toEqual([
        expect.objectContaining({ status, held: 0, total: 1, mediaId: null }),
      ]);
    }
  });

  it('leaves out a refused request, but not what it was for where that is held', () => {
    const refused = aShownRequest({ approval: 'refused' });

    expect(catalogueEntriesOf([], [refused])).toEqual([]);
    expect(catalogueEntriesOf([aHeldTitle()], [refused])).toEqual([
      expect.objectContaining({ status: 'notFollowed', requestId: null }),
    ]);
  });

  it('counts a series by its episodes, held or still to come', () => {
    const request = aShownRequest({
      kind: 'series',
      tmdbId: 1399,
      items: [
        aShownRequestItem({ season: 1, episode: 1, state: 'available' }),
        aShownRequestItem({ season: 1, episode: 2, state: 'waiting' }),
      ],
    });
    const [entry] = catalogueEntriesOf(
      [aHeldTitle({ kind: 'series', id: 'show', catalogueId: '1399', held: 5 })],
      [request],
    );

    expect(entry).toMatchObject({ tab: 'shows', status: 'library', held: 5, total: 5 });
  });

  it('is missing only what it still follows', () => {
    const request = aShownRequest({
      kind: 'series',
      tmdbId: 1399,
      items: [
        aShownRequestItem({ season: 1, episode: 1, state: 'available' }),
        aShownRequestItem({ season: 1, episode: 2, state: 'wanted', isFollowed: false }),
      ],
    });

    expect(catalogueEntriesOf([], [request])).toEqual([
      expect.objectContaining({ status: 'library', held: 1, total: 2 }),
    ]);
  });

  it('lists a title held in two libraries once', () => {
    expect(
      catalogueEntriesOf([aHeldTitle(), aHeldTitle({ id: 'film-2', libraryId: 'films-4k' })], []),
    ).toHaveLength(1);
  });

  it('matches a book by its author and title, and keeps an unmatched title on its own', () => {
    const request = aShownRequest({
      kind: 'book',
      tmdbId: null,
      openLibraryId: 27,
      title: 'A Book',
      artistName: 'An Author',
      items: [aShownRequestItem({ state: 'available' })],
    });
    const entries = catalogueEntriesOf(
      [
        aHeldTitle({
          kind: 'book',
          id: 'book-1',
          catalogueId: null,
          title: 'a book',
          subtitle: 'An Author, Someone Else',
          isAudio: true,
        }),
        aHeldTitle({ id: 'film-9', catalogueId: null, title: 'Home video' }),
      ],
      [request],
    );

    expect(entries).toEqual([
      expect.objectContaining({ tab: 'books', requestId: request.id, isAudio: true }),
      expect.objectContaining({ key: 'film:row:film-9', status: 'notFollowed' }),
    ]);
  });

  it('files music under one tab, artists and albums alike', () => {
    const entries = catalogueEntriesOf(
      [
        aHeldTitle({ kind: 'artist', id: 'a', catalogueId: 'mb-artist' }),
        aHeldTitle({ kind: 'album', id: 'b', catalogueId: 'mb-group', subtitle: 'Artist' }),
      ],
      [],
    );

    expect(entries.map((entry) => [entry.tab, entry.kind])).toEqual([
      ['music', 'artist'],
      ['music', 'album'],
    ]);
  });
});
