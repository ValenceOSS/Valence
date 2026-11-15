import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { useEverythingToBrowse } from '@ValenceClient/library/useEverythingToBrowse';
import type { Browsing } from '@ValenceClient/library/useEverythingToBrowse';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const fetchItemsAcross = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchItemsAcross }));

const TOTAL = 450;

/**
 * A film, numbered.
 *
 * @param at - Which.
 * @returns The film.
 */
const aFilm = (at: number): MediaSummary =>
  aMediaSummary({
    id: `film-${at.toString()}`,
    title: `Film ${at.toString().padStart(3, '0')}`,
    genres: at % 2 === 0 ? ['Drama'] : ['Comedy'],
    addedAt: new Date(Date.UTC(2026, 0, 1) + at * 60_000).toISOString(),
  });

const BROWSING: Browsing = {
  libraryIds: ['films'],
  kind: 'films',
  asked: {},
  arrangement: { order: 'title', isHidingWatched: false },
  isFinished: () => false,
  isWanted: true,
};

const heldBack: (() => void)[] = [];

beforeEach(() => {
  heldBack.length = 0;
  fetchItemsAcross.mockReset();
  fetchItemsAcross.mockImplementation(
    async (_ids: readonly string[], options: { limit: number; offset: number }) => {
      if (options.offset > 0) {
        await new Promise<void>((resolve) => {
          heldBack.push(resolve);
        });
      }

      return {
        items: Array.from(
          { length: Math.max(0, Math.min(options.limit, TOTAL - options.offset)) },
          (_, at) => aFilm(options.offset + at),
        ),
        total: TOTAL,
      };
    },
  );
});

describe('useEverythingToBrowse', () => {
  it('draws the first page while the rest is still coming, then all of it', async () => {
    const browsed = renderHookInACache(() => useEverythingToBrowse(BROWSING));

    await waitFor(() => {
      expect(browsed.result.current.found).toHaveLength(200);
    });

    expect(browsed.result.current.isWaiting).toBe(false);
    expect(browsed.result.current.isStillReading).toBe(true);

    act(() => {
      for (const letGo of heldBack) {
        letGo();
      }
    });

    await waitFor(() => {
      expect(browsed.result.current.found).toHaveLength(TOTAL);
    });

    expect(browsed.result.current.isStillReading).toBe(false);
    expect(browsed.result.current.cells[0]?.title).toBe('Film 000');
  });

  it('reads newest first, so the usual order is right from the first page', async () => {
    renderHookInACache(() => useEverythingToBrowse(BROWSING));

    await waitFor(() => {
      expect(fetchItemsAcross).toHaveBeenCalledWith(
        ['films'],
        expect.objectContaining({ kind: 'films', order: 'newest', offset: 0 }),
      );
    });
  });

  it('narrows by genre without reading anything again', async () => {
    fetchItemsAcross.mockResolvedValue({ items: [aFilm(1), aFilm(2)], total: 2 });
    const browsed = renderHookInACache(
      (asked: Browsing['asked']) => useEverythingToBrowse({ ...BROWSING, asked }),
      { initialProps: {} },
    );

    await waitFor(() => {
      expect(browsed.result.current.found).toHaveLength(2);
    });

    browsed.rerender({ genres: ['Drama'] });

    expect(browsed.result.current.found.map((film) => film.id)).toEqual(['film-2']);
    expect(fetchItemsAcross).toHaveBeenCalledTimes(1);
  });

  it('asks the server again for what only it can narrow by', async () => {
    fetchItemsAcross.mockResolvedValue({ items: [aFilm(1)], total: 1 });
    const browsed = renderHookInACache(
      (asked: Browsing['asked']) => useEverythingToBrowse({ ...BROWSING, asked }),
      { initialProps: {} },
    );

    await waitFor(() => {
      expect(browsed.result.current.found).toHaveLength(1);
    });

    browsed.rerender({ audioLanguages: ['fr'] });

    await waitFor(() => {
      expect(fetchItemsAcross).toHaveBeenLastCalledWith(
        ['films'],
        expect.objectContaining({ audioLanguages: ['fr'] }),
      );
    });
  });

  it('hands back nothing for a page that is not showing', () => {
    const browsed = renderHookInACache(() =>
      useEverythingToBrowse({ ...BROWSING, isWanted: false }),
    );

    expect(browsed.result.current.cells).toEqual([]);
    expect(browsed.result.current.isWaiting).toBe(false);
    expect(fetchItemsAcross).not.toHaveBeenCalled();
  });
});
