import { describe, expect, it, vi } from 'vitest';
import { createHomeShelves } from './createHomeShelves';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ListItemsOptions } from '@ValenceServer/library/LibraryService';

const film = (id: string): MediaSummary => ({
  id,
  libraryId: 'library',
  title: id,
  year: 2020,
  durationSeconds: 5400,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
});

const films = (prefix: string, count: number): MediaSummary[] =>
  Array.from({ length: count }, (_, at) => film(`${prefix}-${at.toString()}`));

/**
 * A library answering each genre and decade with the films given for it, and nothing for anything
 * else.
 */
const aLibrary = (
  byGenre: Record<string, MediaSummary[]>,
  byDecade: Record<number, MediaSummary[]> = {},
) => {
  const listItems = vi.fn(
    (
      _viewer: string,
      _ids: readonly string[],
      options: ListItemsOptions & { counted?: boolean },
    ) => {
      const items =
        options.offset > 0 || options.order === 'newest' || options.order === 'title'
          ? []
          : options.genre !== undefined
            ? options.yearFrom === undefined
              ? (byGenre[options.genre] ?? [])
              : []
            : options.yearFrom === undefined
              ? []
              : (byDecade[options.yearFrom] ?? []);

      return Promise.resolve({ items, total: items.length });
    },
  );

  return createHomeShelves<string>({
    listItems,
    listFacets: () =>
      Promise.resolve({
        genres: Object.keys(byGenre),
        decades: Object.keys(byDecade).map(Number),
      }),
  });
};

describe('createHomeShelves', () => {
  it('serves a shelf for each genre, those leaned towards first, then each decade', async () => {
    const shelves = aLibrary(
      { Drama: films('drama', 5), Crime: films('crime', 5) },
      { 1990: films('nineties', 5) },
    );

    const page = await shelves.read('viewer', {
      libraryIds: ['library'],
      leaning: ['Crime'],
      count: 3,
    });

    expect(page.shelves.map((one) => one.id)).toEqual([
      'genre:Crime',
      'genre:Drama',
      'decade:1990',
    ]);
  });

  it('shows a title on one shelf only, and passes over a shelf left with too little', async () => {
    const shared = films('shared', 5);
    const shelves = aLibrary({ Drama: shared, Crime: shared, War: films('war', 5) });

    const page = await shelves.read('viewer', { libraryIds: ['library'], leaning: [], count: 2 });

    expect(page.shelves.map((one) => one.id)).toEqual(['genre:Drama', 'genre:War']);
  });

  it('carries on from where the last page left off', async () => {
    const shelves = aLibrary({
      Drama: films('drama', 5),
      Crime: films('crime', 5),
      War: films('war', 5),
      ...Object.fromEntries(
        Array.from({ length: 10 }, (_, at) => [
          `Genre ${at.toString()}`,
          films(`g${at.toString()}`, 5),
        ]),
      ),
    });

    const first = await shelves.read('viewer', { libraryIds: ['library'], leaning: [], count: 2 });
    const next = await shelves.read('viewer', {
      libraryIds: ['library'],
      leaning: [],
      count: 2,
      ...(first.cursor === null ? {} : { cursor: first.cursor }),
    });

    expect(first.cursor).not.toBeNull();

    const seen = [...first.shelves, ...next.shelves].map((one) => one.id);

    expect(new Set(seen).size).toBe(seen.length);
  });

  it('brings the shelves round again once every one has been shown, for as long as it is asked', async () => {
    const shelves = aLibrary({ Drama: films('drama', 5) });

    const page = await shelves.read('viewer', { libraryIds: ['library'], leaning: [], count: 3 });

    expect(page.shelves.map((one) => one.kind)).toEqual(['genre', 'again', 'again']);
    expect(page.shelves[1]?.items).toEqual(page.shelves[0]?.items);
    expect(page.cursor).not.toBeNull();
  });

  it('has nothing to serve, and no next page, where the libraries hold nothing', async () => {
    const shelves = aLibrary({});

    await expect(
      shelves.read('viewer', { libraryIds: ['library'], leaning: [], count: 5 }),
    ).resolves.toEqual({ shelves: [], cursor: null });
  });

  it('starts again from the top for a cursor it no longer remembers', async () => {
    const shelves = aLibrary({ Drama: films('drama', 5) });

    const page = await shelves.read('viewer', {
      libraryIds: ['library'],
      leaning: [],
      count: 1,
      cursor: 'forgotten',
    });

    expect(page.shelves.map((one) => one.id)).toEqual(['genre:Drama']);
  });
});
