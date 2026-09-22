import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useLibraryFilters } from './useLibraryFilters';
import type { LibraryFacets } from '@ValenceContracts/schemas/Library';

const fetchFacets = vi.fn<() => Promise<LibraryFacets>>();

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () => fetchFacets(),
}));

beforeEach(() => {
  fetchFacets.mockReset().mockResolvedValue({
    genres: ['Drama', 'Comedy'],
    decades: [1990, 2000],
    maxRating: 8.4,
  });
});

describe('useLibraryFilters', () => {
  it('offers only what the libraries actually hold, in groups', async () => {
    const { result } = renderHookInACache(() => useLibraryFilters());

    await waitFor(() => {
      expect(result.current.groups.map((group) => group.name)).toEqual([
        'Genre',
        'Decade',
        'Rating',
        'Your rating',
      ]);
    });

    expect(result.current.groups[1]?.options.map((option) => option.label)).toEqual([
      '1990s',
      '2000s',
    ]);
    expect(result.current.groups[2]?.options.map((option) => option.label)).toEqual([
      '6+',
      '7+',
      '8+',
    ]);
  });

  it('asks for a decade as the years either side of it, and a rating as a floor', async () => {
    const { result } = renderHookInACache(() => useLibraryFilters());

    await waitFor(() => {
      expect(result.current.groups).not.toHaveLength(0);
    });

    act(() => {
      result.current.change(new Set(['decade:1990', 'rating:7', 'genre:Drama']));
    });

    expect(result.current.asked).toEqual({
      genre: 'Drama',
      yearFrom: 1990,
      yearTo: 1999,
      minRating: 7,
    });
    expect(result.current.selected).toEqual(new Set(['genre:Drama', 'decade:1990', 'rating:7']));
  });

  it('takes every filter off at once', () => {
    const { result } = renderHookInACache(() => useLibraryFilters());

    act(() => {
      result.current.change(new Set(['decade:1990', 'yours:4']));
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.asked).toEqual({});
    expect(result.current.selected.size).toBe(0);
  });

  it('leaves the genre to the caller where the caller keeps it', () => {
    const onGenreChange = vi.fn();
    const { result } = renderHookInACache(() =>
      useLibraryFilters({ genre: 'Comedy', onGenreChange }),
    );

    expect(result.current.asked).toEqual({ genre: 'Comedy' });

    act(() => {
      result.current.change(new Set(['genre:Drama']));
    });

    expect(onGenreChange).toHaveBeenCalledWith('Drama');
  });
});
