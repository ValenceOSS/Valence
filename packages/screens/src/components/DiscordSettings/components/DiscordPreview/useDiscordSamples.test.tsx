import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { useDiscordSamples } from './useDiscordSamples';
import type { ReactNode } from 'react';

const fetchLibraries = vi.hoisted(() => vi.fn());
const fetchLibraryItems = vi.hoisted(() => vi.fn());
const fetchAlbums = vi.hoisted(() => vi.fn());
const fetchAlbum = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchLibraries, fetchLibraryItems }));
vi.mock('@ValenceClient/music/fetchMusic', () => ({ fetchAlbums, fetchAlbum }));

const aTitle = (n: number, seriesTitle?: string) =>
  MediaSummarySchema.parse({
    id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
    libraryId: '00000000-0000-4000-8000-0000000000b1',
    title: `Title ${n.toString()}`,
    year: 2016,
    durationSeconds: 3000,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    ...(seriesTitle === undefined ? {} : { seriesTitle, seasonNumber: 1, episodeNumber: n }),
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  fetchLibraries.mockReset().mockResolvedValue([
    { id: 'films', name: 'Films', kind: 'movies' },
    { id: 'shows', name: 'Shows', kind: 'shows' },
    { id: 'music', name: 'Music', kind: 'music' },
  ]);
  fetchLibraryItems.mockReset().mockImplementation((libraryId: string) =>
    Promise.resolve({
      items:
        libraryId === 'films'
          ? [aTitle(1), aTitle(2)]
          : [aTitle(3, 'A Programme'), aTitle(4, 'A Programme')],
      total: 2,
    }),
  );
  fetchAlbums.mockReset().mockResolvedValue([{ id: 'album-1', title: 'An Album' }]);
  fetchAlbum.mockReset().mockResolvedValue({ tracks: [aTrack(1), aTrack(2)] });
});

describe('useDiscordSamples', () => {
  it('picks a film, an episode and a track from the libraries of each kind', async () => {
    const { result } = renderHook(() => useDiscordSamples(), { wrapper });

    await waitFor(() => {
      expect(result.current.track).not.toBeNull();
    });

    expect(result.current.film?.seriesTitle ?? null).toBeNull();
    expect(result.current.episode?.seriesTitle).toBe('A Programme');
    expect(fetchLibraryItems).not.toHaveBeenCalledWith('music', expect.anything());
  });

  it('keeps its choice until asked to pick again', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { result, rerender } = renderHook(() => useDiscordSamples(), { wrapper });

    await waitFor(() => {
      expect(result.current.film).not.toBeNull();
    });

    expect(result.current.film?.title).toBe('Title 1');

    rerender();

    expect(result.current.film?.title).toBe('Title 1');

    random.mockReturnValue(0.99);

    act(() => {
      result.current.pickAgain();
    });

    expect(result.current.film?.title).toBe('Title 2');

    random.mockRestore();
  });

  it('has nothing to show of a kind the server has no library of', async () => {
    fetchLibraries.mockResolvedValue([]);
    fetchAlbums.mockResolvedValue([]);

    const { result } = renderHook(() => useDiscordSamples(), { wrapper });

    await waitFor(() => {
      expect(fetchLibraries).toHaveBeenCalled();
    });

    expect(result.current.film).toBeNull();
    expect(result.current.episode).toBeNull();
    expect(result.current.track).toBeNull();
  });
});
