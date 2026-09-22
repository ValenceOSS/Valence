import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MusicMiniPlayer } from './MusicMiniPlayer';
import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

const A_TRACK: WhatIsPlaying = {
  trackId: 'a-track',
  title: 'How Not To Drown',
  artists: [
    { id: 'chvrches', name: 'CHVRCHES' },
    { id: null, name: 'Robert Smith' },
  ],
  albumId: 'an-album',
  albumTitle: 'Screen Violence',
  hasArtwork: true,
  positionSeconds: 12,
  durationSeconds: 331,
  isPlaying: true,
  isLoading: false,
  volume: 1,
  remote: null,
};

describe('MusicMiniPlayer', () => {
  it('names the track and who made it', () => {
    render(<MusicMiniPlayer shown={A_TRACK} onOpen={() => {}} onTogglePlay={() => {}} />);

    expect(screen.getByText('How Not To Drown')).toBeInTheDocument();
    expect(screen.getByText('CHVRCHES, Robert Smith')).toBeInTheDocument();
  });

  it('opens the full player when the track itself is pressed', async () => {
    const actor = userEvent.setup();
    const onOpen = vi.fn();

    render(<MusicMiniPlayer shown={A_TRACK} onOpen={onOpen} onTogglePlay={() => {}} />);

    await actor.click(screen.getByRole('button', { name: 'Open How Not To Drown' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('offers to pause a track that is playing', () => {
    render(<MusicMiniPlayer shown={A_TRACK} onOpen={() => {}} onTogglePlay={() => {}} />);

    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('offers to resume a track that is paused', () => {
    render(
      <MusicMiniPlayer
        shown={{ ...A_TRACK, isPlaying: false }}
        onOpen={() => {}}
        onTogglePlay={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('tells the player to pause without opening the full view', async () => {
    const actor = userEvent.setup();
    const onOpen = vi.fn();
    const onTogglePlay = vi.fn();

    render(<MusicMiniPlayer shown={A_TRACK} onOpen={onOpen} onTogglePlay={onTogglePlay} />);

    await actor.click(screen.getByRole('button', { name: 'Pause' }));

    expect(onTogglePlay).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicMiniPlayer.displayName).toBe('MusicMiniPlayer');
  });
});
