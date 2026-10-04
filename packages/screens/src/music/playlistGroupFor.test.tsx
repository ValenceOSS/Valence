import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from '@ValenceUI/notify';
import { addToPlaylist, createPlaylist } from '@ValenceClient/music/fetchPlaylists';
import { playlistGroupFor } from './playlistGroupFor';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

vi.mock('@ValenceUI/notify', () => ({
  notify: { worked: vi.fn(), failed: vi.fn(), say: vi.fn() },
}));

vi.mock('@ValenceClient/music/fetchPlaylists', () => ({
  createPlaylist: vi.fn(),
  addToPlaylist: vi.fn(),
}));

const MINE: PlaylistSummary = {
  id: '00000000-0000-4000-8000-00000000c1c1',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: '00000000-0000-4000-8000-000000000001', name: 'Dan', colour: '#3a8ee8' },
  entryCount: 3,
  lostCount: 0,
  durationSeconds: 600,
  artworkAlbumIds: [],
  hasOwnArtwork: false,
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const choose = (group: ReturnType<typeof playlistGroupFor>, id: string) => {
  const item = group.items.find((each) => each.id === id);

  if (item === undefined) {
    throw new Error(`No item ${id}`);
  }

  item.onChoose();
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('playlistGroupFor', () => {
  it('offers a new playlist and every one of this profile’s own', () => {
    const group = playlistGroupFor(
      'The Black Parade',
      () => Promise.resolve(['t1']),
      { mine: [MINE], changed: vi.fn() },
      vi.fn(),
    );

    expect(group.name).toBe('Add to playlist');
    expect(group.items.map((item) => item.label)).toEqual(['New playlist', 'Sunday morning']);
  });

  it('makes a playlist named after what is added and opens it', async () => {
    vi.mocked(createPlaylist).mockResolvedValue(MINE);

    const changed = vi.fn();
    const open = vi.fn();

    choose(
      playlistGroupFor(
        'The Black Parade',
        () => Promise.resolve(['t1', 't2']),
        { mine: [], changed },
        open,
      ),
      'new',
    );

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith({ kind: 'playlist', id: MINE.id });
    });
    expect(createPlaylist).toHaveBeenCalledWith({
      name: 'The Black Parade',
      mediaItemIds: ['t1', 't2'],
    });
    expect(changed).toHaveBeenCalled();
  });

  it('says so when a playlist could not be made', async () => {
    vi.mocked(createPlaylist).mockResolvedValue(null);

    const open = vi.fn();

    choose(
      playlistGroupFor(
        'The Black Parade',
        () => Promise.resolve(['t1']),
        { mine: [], changed: vi.fn() },
        open,
      ),
      'new',
    );

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('Couldn’t create the playlist.');
    });
    expect(open).not.toHaveBeenCalled();
  });

  it('adds to one of this profile’s own and says whether it worked', async () => {
    vi.mocked(addToPlaylist).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const group = playlistGroupFor(
      'The Black Parade',
      () => Promise.resolve(['t1']),
      { mine: [MINE], changed: vi.fn() },
      vi.fn(),
    );

    choose(group, `playlist-${MINE.id}`);

    await waitFor(() => {
      expect(notify.worked).toHaveBeenCalledWith('Added to Sunday morning');
    });
    expect(addToPlaylist).toHaveBeenCalledWith(MINE.id, ['t1']);

    choose(group, `playlist-${MINE.id}`);

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('Couldn’t add that to Sunday morning.');
    });
  });

  it('adds nothing when there is nothing to add', async () => {
    choose(
      playlistGroupFor(
        'An empty album',
        () => Promise.resolve([]),
        { mine: [], changed: vi.fn() },
        vi.fn(),
      ),
      'new',
    );

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('An empty album has nothing to add.');
    });
    expect(createPlaylist).not.toHaveBeenCalled();
  });

  it('adds at most five hundred songs at once', async () => {
    vi.mocked(addToPlaylist).mockResolvedValue(true);

    const many = Array.from({ length: 600 }, (_, at) => `t${at.toString()}`);

    choose(
      playlistGroupFor(
        'Everything',
        () => Promise.resolve(many),
        { mine: [MINE], changed: vi.fn() },
        vi.fn(),
      ),
      `playlist-${MINE.id}`,
    );

    await waitFor(() => {
      expect(addToPlaylist).toHaveBeenCalled();
    });
    expect(vi.mocked(addToPlaylist).mock.calls[0]?.[1]).toHaveLength(500);
  });
});
