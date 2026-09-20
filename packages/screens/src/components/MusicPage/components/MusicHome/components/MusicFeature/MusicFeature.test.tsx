import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { startQueue } from '@ValenceClient/music/playQueue';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { setMusicVideo, useMusicVideo } from '@ValenceScreens/music/musicVideo';
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

  it('puts the song playing at the front, with what comes after it', () => {
    const { player } = aFakeMusicPlayer({
      current: PLAYING,
      isPlaying: true,
      queue: startQueue([PLAYING, aTrack(2), aTrack(3)], 0),
    });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    expect(screen.getByRole('heading', { name: 'Track 1' })).toBeInTheDocument();
    expect(screen.getByText('Now playing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Track 2 now' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lyrics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open album' })).not.toBeInTheDocument();
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

  it('jumps to a song coming up', async () => {
    const { player } = aFakeMusicPlayer({
      current: PLAYING,
      isPlaying: true,
      queue: startQueue([PLAYING, aTrack(2)], 0),
    });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Play Track 2 now' }));

    expect(player.jumpTo).toHaveBeenCalledWith(1);
  });

  it('plays the video of the song playing, pausing the music for it', async () => {
    const { player } = aFakeMusicPlayer({
      current: aTrack(1, { videoKey: 'abcdefghijk' }),
      isPlaying: true,
    });

    renderInAnAddress(<MusicFeature newest={NEWEST} player={player} />);

    await userEvent.click(screen.getByRole('button', { name: 'Watch the video' }));

    expect(player.pause).toHaveBeenCalled();
    expect(renderHook(() => useMusicVideo()).result.current).toEqual({
      title: 'Track 1',
      videoKey: 'abcdefghijk',
    });
    setMusicVideo(null);
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
