import { screen, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { setMusicVideo, useMusicVideo } from '@ValenceScreens/music/musicVideo';
import { TrackMenu } from './TrackMenu';

/**
 * The music video asked for, as the section's one player would read it.
 *
 * @returns The video, or nothing.
 */
const readVideo = () => renderHook(() => useMusicVideo()).result.current;

const playlists = vi.hoisted(() => ({
  fetchPlaylists: vi.fn(),
  addToPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
}));

vi.mock('@ValenceScreens/music/theMusicPlayer', () => ({
  theMusicPlayer: () => fake.player,
}));

let fake = aFakeMusicPlayer();

vi.mock('@ValenceClient/music/fetchPlaylists', () => playlists);

const MINE = {
  id: '00000000-0000-4000-8000-00000000d0d0',
  name: 'Sunday morning',
  description: null,
  isShared: false,
  isOrdered: false,
  isMine: true,
  owner: { profileId: 'p', name: 'Dan', colour: '#fff' },
  entryCount: 0,
  lostCount: 0,
  durationSeconds: 0,
  artworkAlbumIds: [],
  updatedAt: '',
};

beforeEach(() => {
  setMusicVideo(null);
  fake = aFakeMusicPlayer();
  playlists.fetchPlaylists.mockResolvedValue([
    MINE,
    { ...MINE, id: 'x', name: 'Theirs', isMine: false },
  ]);
  playlists.addToPlaylist.mockResolvedValue(true);
  playlists.createPlaylist.mockResolvedValue({ ...MINE, id: 'new', name: 'Track 1' });
});

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'More for Track 1' }));
};

describe('TrackMenu', () => {
  it('queues a song to play next', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Play next' }));

    expect(fake.player.playNext).toHaveBeenCalledWith([aTrack(1)]);
  });

  it('adds a song to the end of the queue', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Add to queue' }));

    expect(fake.player.addToQueue).toHaveBeenCalledWith([aTrack(1)]);
  });

  it('offers only this profile’s own playlists to add to', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: 'Sunday morning' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Theirs' })).not.toBeInTheDocument();
  });

  it('adds a song to a playlist', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sunday morning' }));

    await waitFor(() => {
      expect(playlists.addToPlaylist).toHaveBeenCalledWith(MINE.id, [aTrack(1).id]);
    });
  });

  it('makes a new playlist with the song in it', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'New playlist' }));

    await waitFor(() => {
      expect(playlists.createPlaylist).toHaveBeenCalledWith({
        name: 'Track 1',
        mediaItemIds: [aTrack(1).id],
      });
    });
  });

  it('offers to take a song out only where it is in one of yours', async () => {
    const onRemove = vi.fn();

    renderInAnAddress(<TrackMenu track={aTrack(1)} onRemove={onRemove} />);

    await openMenu();
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Remove from this playlist' }),
    );

    expect(onRemove).toHaveBeenCalled();
  });

  it('does not offer to take out a song that is not in a playlist of yours', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();

    expect(
      screen.queryByRole('menuitem', { name: 'Remove from this playlist' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrackMenu.displayName).toBe('TrackMenu');
  });

  it('moves a song within a playlist of yours', async () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    renderInAnAddress(<TrackMenu track={aTrack(1)} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move up' }));
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move down' }));

    expect(onMoveUp).toHaveBeenCalled();
    expect(onMoveDown).toHaveBeenCalled();
  });

  it('plays a song’s music video, pausing the music for it', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1, { videoKey: 'abcdefghijk' })} />);

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Watch the video' }));

    expect(fake.player.pause).toHaveBeenCalled();
    expect(readVideo()).toEqual({ title: 'Track 1', videoKey: 'abcdefghijk' });
  });

  it('offers no video for a song without one', async () => {
    renderInAnAddress(<TrackMenu track={aTrack(1)} />);

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Watch the video' })).not.toBeInTheDocument();
  });
});
