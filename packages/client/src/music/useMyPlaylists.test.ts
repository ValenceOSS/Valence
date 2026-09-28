import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useMyPlaylists } from './useMyPlaylists';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

const fetchPlaylists = vi.fn<() => Promise<PlaylistSummary[]>>();

vi.mock('@ValenceClient/music/fetchPlaylists', () => ({
  fetchPlaylists: () => fetchPlaylists(),
  fetchPlaylist: vi.fn(),
}));

const aPlaylist = (n: number, isMine: boolean): PlaylistSummary => ({
  id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
  name: `Playlist ${n.toString()}`,
  description: null,
  isShared: !isMine,
  isOrdered: false,
  isMine,
  owner: null,
  entryCount: 0,
  lostCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  updatedAt: '2026-09-28T00:00:00.000Z',
});

beforeEach(() => {
  fetchPlaylists.mockReset().mockResolvedValue([aPlaylist(1, true), aPlaylist(2, false)]);
});

describe('useMyPlaylists', () => {
  it('holds only the playlists this profile made', async () => {
    const { result } = renderHookInACache(() => useMyPlaylists());

    await waitFor(() => {
      expect(result.current.mine.map((playlist) => playlist.name)).toEqual(['Playlist 1']);
    });
  });

  it('holds nothing while they are still being read', () => {
    fetchPlaylists.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHookInACache(() => useMyPlaylists());

    expect(result.current.mine).toEqual([]);
  });

  it('reads them again once one has changed', async () => {
    const { result } = renderHookInACache(() => useMyPlaylists());

    await waitFor(() => {
      expect(fetchPlaylists).toHaveBeenCalledTimes(1);
    });

    result.current.changed();

    await waitFor(() => {
      expect(fetchPlaylists).toHaveBeenCalledTimes(2);
    });
  });
});
