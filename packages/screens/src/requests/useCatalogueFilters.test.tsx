import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalogueFilters } from '@ValenceScreens/requests/useCatalogueFilters';
import type { ReactNode } from 'react';

const fetchGenresMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchCatalogueGenres: fetchGenresMock,
}));

beforeEach(() => {
  fetchGenresMock.mockReset();
  fetchGenresMock.mockResolvedValue([
    { id: '28', name: 'Action' },
    { id: '878', name: 'Science Fiction' },
  ]);
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useCatalogueFilters', () => {
  it('offers the catalogue’s genres for the kind, and a decade and a rating to go with them', async () => {
    const { result } = renderHook(() => useCatalogueFilters('film'), { wrapper });

    await waitFor(() => {
      expect(result.current.groups.map((group) => group.name)).toEqual([
        'Genre',
        'Decade',
        'Rating',
      ]);
    });

    expect(fetchGenresMock).toHaveBeenCalledWith('film');
    expect(result.current.groups[0]?.options).toEqual([
      { id: 'genre:28', label: 'Action' },
      { id: 'genre:878', label: 'Science Fiction' },
    ]);
  });

  it('does not offer a genre row until the genres have been read', () => {
    fetchGenresMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useCatalogueFilters('series'), { wrapper });

    expect(result.current.groups.map((group) => group.name)).toEqual(['Decade', 'Rating']);
  });

  it('asks for nothing until something is chosen', () => {
    const { result } = renderHook(() => useCatalogueFilters('film'), { wrapper });

    expect(result.current.asked).toEqual({});
    expect(result.current.selected.size).toBe(0);
  });

  it('turns a chosen genre, decade and rating into a question for the catalogue', () => {
    const { result } = renderHook(() => useCatalogueFilters('film'), { wrapper });

    act(() => {
      result.current.change(new Set(['genre:878', 'decade:1990', 'rating:7']));
    });

    expect(result.current.asked).toEqual({
      genre: '878',
      yearFrom: 1990,
      yearTo: 1999,
      minRating: 7,
    });
    expect([...result.current.selected].sort()).toEqual(['decade:1990', 'genre:878', 'rating:7']);
  });

  it('keeps the same question until a choice changes', () => {
    const { result, rerender } = renderHook(() => useCatalogueFilters('film'), { wrapper });

    act(() => {
      result.current.change(new Set(['rating:8']));
    });

    const before = result.current.asked;

    rerender();

    expect(result.current.asked).toBe(before);
  });

  it('clears everything at once', () => {
    const { result } = renderHook(() => useCatalogueFilters('film'), { wrapper });

    act(() => {
      result.current.change(new Set(['genre:28', 'rating:6']));
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.asked).toEqual({});
  });
});
