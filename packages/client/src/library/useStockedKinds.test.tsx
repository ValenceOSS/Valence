import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import {
  fetchItemsAcross,
  fetchLibraries,
  fetchLibraryItems,
} from '@ValenceClient/library/fetchLibrary';
import { useStockedKinds } from './useStockedKinds';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: vi.fn(),
  fetchLibraryItems: vi.fn(),
  fetchItemsAcross: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchLibraries).mockReset();
  vi.mocked(fetchLibraryItems).mockReset();
  vi.mocked(fetchItemsAcross).mockReset();
});

describe('useStockedKinds', () => {
  it('offers a kind only where a library of it holds something', async () => {
    vi.mocked(fetchLibraries).mockResolvedValue([
      aLibrary({ id: '00000000-0000-4000-8000-0000000000a1', kind: 'movies', itemCount: 4 }),
      aLibrary({ id: '00000000-0000-4000-8000-0000000000a2', kind: 'shows', itemCount: 0 }),
      aLibrary({ id: '00000000-0000-4000-8000-0000000000a3', kind: 'music', itemCount: 120 }),
    ]);
    vi.mocked(fetchItemsAcross).mockImplementation((libraryIds) => {
      const holds = libraryIds.some((libraryId) => libraryId.endsWith('a1'));

      return Promise.resolve({ items: holds ? [aMediaSummary()] : [], total: holds ? 1 : 0 });
    });

    const { result } = renderHookInACache(() => useStockedKinds());

    await waitFor(() => {
      expect(result.current).toEqual({ films: true, shows: false, books: false, music: true });
    });
  });

  it('offers no films where the films library is there but empty', async () => {
    vi.mocked(fetchLibraries).mockResolvedValue([aLibrary({ kind: 'movies', itemCount: 0 })]);
    vi.mocked(fetchItemsAcross).mockResolvedValue({ items: [], total: 0 });

    const { result } = renderHookInACache(() => useStockedKinds());

    await waitFor(() => {
      expect(result.current?.films).toBe(false);
    });
  });

  it('says nothing until the server has answered', () => {
    vi.mocked(fetchLibraries).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHookInACache(() => useStockedKinds());

    expect(result.current).toBeNull();
  });
});
