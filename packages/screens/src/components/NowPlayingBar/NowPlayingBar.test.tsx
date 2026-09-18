import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { setMusicPanel } from '@ValenceScreens/music/musicPanel';
import { setListeningParty } from '@ValenceScreens/music/listeningParty';
import type { ListeningParty } from '@ValenceScreens/music/listeningParty';
import { NowPlayingBar } from './NowPlayingBar';

const favourites = vi.hoisted(() => ({ fetchFavourites: vi.fn(), setFavourite: vi.fn() }));

const devices = vi.hoisted(() => ({ fetchMusicDevices: vi.fn() }));

vi.mock('@ValenceClient/library/fetchFavourites', () => favourites);

vi.mock('@ValenceClient/music/musicDevices', () => devices);

const TRACK = aTrack(1);

const playing = (overrides = {}) =>
  aFakeMusicPlayer({
    queue: startQueue([TRACK, aTrack(2)], 0),
    current: TRACK,
    isPlaying: true,
    positionSeconds: 65,
    durationSeconds: 201,
    ...overrides,
  });

beforeEach(() => {
  favourites.fetchFavourites.mockResolvedValue([]);
  favourites.setFavourite.mockResolvedValue(true);
  devices.fetchMusicDevices.mockResolvedValue([]);
  setMusicPanel(null);
  setListeningParty(null);
});

const inAParty = (overrides: Partial<ListeningParty> = {}): ListeningParty => ({
  party: {
    id: 'p1',
    kind: 'listen',
    mediaId: TRACK.id,
    createdAtMs: 0,
    everyoneMaySeek: false,
    everyoneMayPlayPause: false,
    hasPassword: false,
    isPlaying: true,
    isHeld: false,
    members: [],
    timekeeperId: null,
  },
  hostName: 'Dan',
  mayChoose: false,
  mayPlayPause: false,
  maySeek: false,
  send: vi.fn(),
  ...overrides,
});

describe('NowPlayingBar', () => {
  it('is not there while nothing is playing', () => {
    renderInAnAddress(<NowPlayingBar player={aFakeMusicPlayer().player} />);

    expect(screen.queryByRole('region', { name: 'Now playing' })).not.toBeInTheDocument();
  });

  it('says what is playing, who it is by, and how far through it is', () => {
    renderInAnAddress(<NowPlayingBar player={playing().player} />);

    expect(screen.getByRole('region', { name: 'Now playing' })).toBeInTheDocument();
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sleep Token' })).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3:21')).toBeInTheDocument();
  });

  it('pauses, skips and goes back', async () => {
    const { player } = playing();

    renderInAnAddress(<NowPlayingBar player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(player.pause).toHaveBeenCalled();
    expect(player.next).toHaveBeenCalled();
    expect(player.previous).toHaveBeenCalled();
  });

  it('shuffles and repeats', async () => {
    const { player } = playing();

    renderInAnAddress(<NowPlayingBar player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Shuffle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Repeat everything' }));

    expect(player.toggleShuffle).toHaveBeenCalled();
    expect(player.cycleRepeat).toHaveBeenCalled();
  });

  it('will not shuffle or repeat a queue whose order means something', () => {
    const { player } = playing({ queue: startQueue([TRACK], 0, { isOrdered: true }) });

    renderInAnAddress(<NowPlayingBar player={player} />);

    expect(screen.getByRole('button', { name: 'Shuffle' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Repeat everything' })).toBeDisabled();
  });

  it('likes the song playing', async () => {
    renderInAnAddress(<NowPlayingBar player={playing().player} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Like Track 1' }));

    await waitFor(() => {
      expect(favourites.setFavourite).toHaveBeenCalledWith(TRACK.id, true);
    });
  });

  it('says which quality is streaming', () => {
    renderInAnAddress(<NowPlayingBar player={playing({ playingQuality: 'high' }).player} />);

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('mutes', async () => {
    const { player } = playing();

    renderInAnAddress(<NowPlayingBar player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Mute' }));

    expect(player.toggleMute).toHaveBeenCalled();
  });

  it('pauses the other device by what that device says it is doing, not this one', async () => {
    devices.fetchMusicDevices.mockResolvedValue([
      {
        clientId: 'phone',
        label: 'iPhone',
        nowPlaying: {
          trackId: TRACK.id,
          title: 'Track 1',
          artists: ['Sleep Token'],
          albumId: TRACK.album.id,
          hasArtwork: true,
          positionSeconds: 10,
          durationSeconds: 201,
          isPlaying: true,
          volume: 0.8,
          reportedAtMs: Date.now(),
        },
      },
    ]);

    const { player } = playing({
      isPlaying: false,
      remote: { clientId: 'phone', label: 'iPhone' },
    });

    renderInAnAddress(<NowPlayingBar player={player} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(player.pause).toHaveBeenCalled();
    expect(player.resume).not.toHaveBeenCalled();
  });

  it('says which device it is playing on while controlling another', () => {
    renderInAnAddress(
      <NowPlayingBar player={playing({ remote: { clientId: 'phone', label: 'iPhone' } }).player} />,
    );

    expect(screen.getByText('Playing on iPhone')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NowPlayingBar.displayName).toBe('NowPlayingBar');
  });

  describe("in somebody else's listening party", () => {
    it('says whose music it is and leaves the song to them', () => {
      setListeningParty(inAParty());

      renderInAnAddress(<NowPlayingBar player={playing().player} />);

      expect(screen.getByText('Listening along with Dan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
      expect(screen.getByRole('slider', { name: 'Where the song is' })).toHaveAttribute(
        'data-disabled',
      );
    });

    it('keeps the volume with whoever is listening', async () => {
      setListeningParty(inAParty());

      const { player } = playing();

      renderInAnAddress(<NowPlayingBar player={player} />);

      await userEvent.click(screen.getByRole('button', { name: 'Mute' }));

      expect(player.toggleMute).toHaveBeenCalled();
    });

    it('asks the party to pause where the host has let everybody', async () => {
      const party = inAParty({ mayPlayPause: true });

      setListeningParty(party);

      const { player } = playing();

      renderInAnAddress(<NowPlayingBar player={player} />);

      await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

      expect(party.send).toHaveBeenCalledWith({ kind: 'pause', atSeconds: 65 });
      expect(player.pause).not.toHaveBeenCalled();
    });

    it('lets a listener press play to join in when the music did not start on its own', async () => {
      setListeningParty(inAParty());

      const { player } = playing({ isPlaying: false });

      renderInAnAddress(<NowPlayingBar player={player} />);

      await userEvent.click(screen.getByRole('button', { name: 'Play' }));

      expect(player.resume).toHaveBeenCalled();
    });
  });

  it('says so while hosting a listening party', () => {
    setListeningParty(inAParty({ mayChoose: true, mayPlayPause: true, maySeek: true }));

    renderInAnAddress(<NowPlayingBar player={playing().player} />);

    expect(screen.getByText(/Hosting a listening party/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('opens the listening party beside the music', async () => {
    renderInAnAddress(<NowPlayingBar player={playing().player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Listening party' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Listening party' })).toHaveClass('text-text');
    });
  });
});
