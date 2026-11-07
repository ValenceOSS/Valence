import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { MusicFeature } from './MusicFeature';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

const NEWEST: MusicAlbum = {
  id: '00000000-0000-4000-8000-00000000a1b1',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Even In Arcadia',
  artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
  year: 2025,
  genres: [],
  hasArtwork: false,
  isCompilation: false,
  trackCount: 10,
  durationSeconds: 3000,
  sizeBytes: 0,
  isExplicit: false,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const PLAYING = aTrack(1, { hasLyrics: true });

describe('MusicFeature', () => {
  it('puts the newest record at the front while nothing is playing', () => {
    renderInAnAddress(<MusicFeature newest={NEWEST} player={aFakeMusicPlayer().player} />);

    expect(screen.getByRole('region', { name: 'Newest in your library' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Even In Arcadia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('keeps the newest record at the front while a song plays, leaving it to the player bar', () => {
    const { player } = aFakeMusicPlayer({
      current: PLAYING,
      isPlaying: true,
      queue: startQueue([PLAYING, aTrack(2), aTrack(3)], 0),
    });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    expect(screen.getByRole('heading', { name: 'Even In Arcadia' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Track 1' })).not.toBeInTheDocument();
  });

  it('opens the album when its artwork is pressed', async () => {
    const { player } = aFakeMusicPlayer({ current: PLAYING, isPlaying: true });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    await userEvent.click(screen.getByRole('button', { name: /^Open / }));

    expect(window.location.search).toContain('listen=');
  });

  it('pauses the song playing from the front of the page', async () => {
    const { player } = aFakeMusicPlayer({ current: PLAYING, isPlaying: true });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(player.toggle).toHaveBeenCalled();
  });

  it('draws nothing with nothing to show', () => {
    const { container } = renderInAnAddress(
      <MusicFeature newest={null} player={aFakeMusicPlayer().player} />,
    );

    expect(container.querySelector('section')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicFeature.displayName).toBe('MusicFeature');
  });
});
