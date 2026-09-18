import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { answerMusicRequests } from '@ValenceScreens/testing/answerMusicRequests';
import { setMusicImmersive } from '@ValenceScreens/music/musicImmersive';
import { ImmersiveMusic } from './ImmersiveMusic';

const TRACK = aTrack(1, { hasLyrics: true });

const LYRICS = {
  isSynced: true,
  lines: [
    { atMs: 1000, text: 'If I tell you all my feelings' },
    { atMs: 5000, text: 'Would you believe me, yeah?' },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', answerMusicRequests({ [`/api/music/tracks/${TRACK.id}/lyrics`]: LYRICS }));
});

afterEach(() => {
  setMusicImmersive(false);
});

const playing = () => aFakeMusicPlayer({ current: TRACK, isPlaying: true, positionSeconds: 6 });

describe('ImmersiveMusic', () => {
  it('draws nothing until it is opened', () => {
    renderInAnAddress(<ImmersiveMusic player={playing().player} />);

    expect(screen.queryByRole('region', { name: 'Track 1, immersive' })).not.toBeInTheDocument();
  });

  it('fills the screen with the song and its words, the line being sung marked', async () => {
    renderInAnAddress(<ImmersiveMusic player={playing().player} />);

    act(() => {
      setMusicImmersive(true);
    });

    expect(await screen.findByRole('region', { name: 'Track 1, immersive' })).toBeInTheDocument();
    expect((await screen.findByText('Would you believe me, yeah?')).closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('carries its own quiet controls beneath the cover', async () => {
    const { player } = playing();

    renderInAnAddress(<ImmersiveMusic player={player} />);

    act(() => {
      setMusicImmersive(true);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(player.pause).toHaveBeenCalled();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Like Track 1' })).toBeInTheDocument();
  });

  it('says plainly when no lyrics were found', async () => {
    vi.stubGlobal('fetch', answerMusicRequests({}));

    renderInAnAddress(<ImmersiveMusic player={playing().player} />);

    act(() => {
      setMusicImmersive(true);
    });

    expect(await screen.findByText('No lyrics found')).toBeInTheDocument();
  });

  it('goes away with the close button and with Escape', async () => {
    renderInAnAddress(<ImmersiveMusic player={playing().player} />);

    act(() => {
      setMusicImmersive(true);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Track 1, immersive' })).not.toBeInTheDocument();
    });

    act(() => {
      setMusicImmersive(true);
    });

    await screen.findByRole('region', { name: 'Track 1, immersive' });
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Track 1, immersive' })).not.toBeInTheDocument();
    });
  });

  it('closes itself when nothing is playing', async () => {
    const { player, set } = playing();

    renderInAnAddress(<ImmersiveMusic player={player} />);

    act(() => {
      setMusicImmersive(true);
      set({ current: null });
    });

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /immersive/ })).not.toBeInTheDocument();
    });
  });

  it('carries the view on to the next song', async () => {
    const { player, set } = playing();

    renderInAnAddress(<ImmersiveMusic player={player} />);

    act(() => {
      setMusicImmersive(true);
    });

    await screen.findByRole('heading', { name: 'Track 1' });

    act(() => {
      set({ current: aTrack(2) });
    });

    expect(await screen.findByRole('heading', { name: 'Track 2' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ImmersiveMusic.displayName).toBe('ImmersiveMusic');
  });
});
