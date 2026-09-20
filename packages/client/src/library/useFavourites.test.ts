import { act, waitFor } from '@testing-library/react';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useFavourites } from './useFavourites';
import type * as FetchMusic from '@ValenceClient/music/fetchMusic';

const fetchFavourites = vi.fn<() => Promise<string[]>>();
const setFavourite = vi.fn<(mediaId: string, isKept: boolean) => Promise<boolean>>();
const fetchKeptBooks = vi.fn<() => Promise<string[]>>();
const setBookFavourite = vi.fn<(bookId: string, isKept: boolean) => Promise<boolean>>();

vi.mock('@ValenceClient/library/fetchFavourites', () => ({
  fetchFavourites: () => fetchFavourites(),
  setFavourite: (mediaId: string, isKept: boolean) => setFavourite(mediaId, isKept),
  fetchKeptBooks: () => fetchKeptBooks(),
  setBookFavourite: (bookId: string, isKept: boolean) => setBookFavourite(bookId, isKept),
}));

const fetchLiked = vi.fn<() => Promise<never[]>>();

vi.mock('@ValenceClient/music/fetchMusic', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchMusic>()),
  fetchLiked: () => fetchLiked(),
}));

beforeEach(() => {
  fetchLiked.mockReset().mockResolvedValue([]);
  fetchFavourites.mockReset().mockResolvedValue([]);
  setFavourite.mockReset().mockResolvedValue(true);
  fetchKeptBooks.mockReset().mockResolvedValue([]);
  setBookFavourite.mockReset().mockResolvedValue(true);
});

describe('useFavourites', () => {
  it('reads the liked songs again after a heart, so their page is never left as it was', async () => {
    const { result } = renderHookInACache(() => ({
      kept: useFavourites('watcher-1'),
      liked: useQuery(musicQueries.liked()),
    }));

    await waitFor(() => {
      expect(fetchLiked).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      result.current.kept.toggle('media-1');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchLiked).toHaveBeenCalledTimes(2);
    });
  });

  it('reads the whole list once rather than asking per item', async () => {
    fetchFavourites.mockResolvedValue(['media-1']);

    const { result } = renderHookInACache(() => useFavourites('watcher-1'));

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(true);
    });
    expect(fetchFavourites).toHaveBeenCalledTimes(1);
  });

  it('does not show one person what somebody else kept', async () => {
    fetchFavourites.mockResolvedValue(['media-1']);

    const { result, rerender } = renderHookInACache(
      ({ who }: { who: string }) => useFavourites(who),
      {
        initialProps: { who: 'dan' },
      },
    );

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(true);
    });

    fetchFavourites.mockResolvedValue([]);
    rerender({ who: 'jeff' });

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(false);
    });
    expect(fetchFavourites).toHaveBeenCalledTimes(2);
  });

  it('fills the heart before the server has answered', async () => {
    let answer = (agreed: boolean) => {
      void agreed;
    };

    setFavourite.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );

    const { result } = renderHookInACache(() => useFavourites('watcher-1'));

    await act(async () => {
      result.current.toggle('media-1');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(true);
    });

    await act(async () => {
      answer(true);
      await Promise.resolve();
    });

    expect(result.current.isKept('media-1')).toBe(true);
  });

  it('puts the heart back when the server disagrees', async () => {
    setFavourite.mockResolvedValue(false);

    const { result } = renderHookInACache(() => useFavourites('watcher-1'));

    await act(async () => {
      result.current.toggle('media-1');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(false);
    });
  });

  it('stops keeping something that was kept', async () => {
    fetchFavourites.mockResolvedValue(['media-1']);

    const { result } = renderHookInACache(() => useFavourites('watcher-1'));

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(true);
    });

    await act(async () => {
      result.current.toggle('media-1');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.isKept('media-1')).toBe(false);
    });

    expect(setFavourite).toHaveBeenCalledWith('media-1', false);
  });

  it('keeps books in a list of their own, through the book’s own address', async () => {
    fetchKeptBooks.mockResolvedValue(['book-1']);

    const { result } = renderHookInACache(() => useFavourites('watcher-1', 'books'));

    await waitFor(() => {
      expect(result.current.isKept('book-1')).toBe(true);
    });

    act(() => {
      result.current.toggle('book-2');
    });

    await waitFor(() => {
      expect(setBookFavourite).toHaveBeenCalledWith('book-2', true);
    });
    expect(setFavourite).not.toHaveBeenCalled();
    expect(fetchFavourites).not.toHaveBeenCalled();
  });
});
