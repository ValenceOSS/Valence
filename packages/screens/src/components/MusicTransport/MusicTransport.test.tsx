import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { setListeningParty } from '@ValenceScreens/music/listeningParty';
import { MusicTransport } from './MusicTransport';
import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

const TRACK = aTrack(1);

const SHOWN: WhatIsPlaying = {
  trackId: TRACK.id,
  title: TRACK.title,
  artists: TRACK.artists,
  albumId: TRACK.album.id,
  albumTitle: TRACK.album.title,
  hasArtwork: true,
  positionSeconds: 65,
  durationSeconds: 201,
  isPlaying: true,
  isLoading: false,
  volume: 0.5,
  remote: null,
};

const playing = () =>
  aFakeMusicPlayer({ queue: startQueue([TRACK, aTrack(2)], 0), current: TRACK, isPlaying: true });

afterEach(() => {
  setListeningParty(null);
});

describe('MusicTransport', () => {
  it('pauses, skips and goes back', async () => {
    const { player, set } = playing();

    set({});

    render(<MusicTransport state={player.read()} shown={SHOWN} player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(player.pause).toHaveBeenCalled();
    expect(player.next).toHaveBeenCalled();
    expect(player.previous).toHaveBeenCalled();
  });

  it('says in the immersive look how long is gone and how long is left', () => {
    const { player } = playing();

    render(<MusicTransport state={player.read()} shown={SHOWN} player={player} look="immersive" />);

    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('-2:16')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shuffle' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicTransport.displayName).toBe('MusicTransport');
  });
});
