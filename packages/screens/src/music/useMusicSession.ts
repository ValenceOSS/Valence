import { useEffect, useRef } from 'react';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { artworkTheSystemAccepts } from '@ValenceScreens/playback/artworkTheSystemAccepts';
import { claimTheSystemsControls } from '@ValenceScreens/playback/claimTheSystemsControls';
import type { Claim } from '@ValenceScreens/playback/claimTheSystemsControls';
import type { MusicPlayer, MusicPlayerState } from './createMusicPlayer';

const ARTWORK_SIZES = ['256x256', '512x512'] as const;

/**
 * Puts the song playing on the lock screen, the keyboard's media keys and the system's own
 * controls, with next and previous as well as play and pause — which is most of what makes music
 * usable with the window behind something else.
 *
 * @param state - What the player is doing.
 * @param player - The player the keys drive.
 */
const useMusicSession = (state: MusicPlayerState, player: MusicPlayer): void => {
  const { current } = state;
  const trackId = current?.id ?? null;
  const title = current?.title ?? '';
  const artists = current?.artists.map((artist) => artist.name).join(', ') ?? '';
  const albumTitle = current?.album.title ?? '';
  const albumId = current?.album.hasArtwork === true ? current.album.id : null;
  const claimRef = useRef<Claim | null>(null);

  useEffect(() => {
    if (trackId === null) {
      return;
    }

    const artwork = albumId === null ? null : artworkTheSystemAccepts(albumArtworkUrl(albumId));
    const claim = claimTheSystemsControls({
      metadata: {
        title,
        artist: artists,
        album: albumTitle,
        artwork: artwork === null ? [] : ARTWORK_SIZES.map((sizes) => ({ src: artwork, sizes })),
      },
      handlers: [
        ['play', () => player.resume()],
        ['pause', () => player.pause()],
        ['previoustrack', () => player.previous()],
        ['nexttrack', () => player.next()],
        [
          'seekto',
          (details) => {
            if (typeof details.seekTime === 'number') {
              player.seek(details.seekTime);
            }
          },
        ],
      ],
    });

    claimRef.current = claim;

    return () => {
      claim.release();
      claimRef.current = null;
    };
  }, [trackId, title, artists, albumTitle, albumId, player]);

  useEffect(() => {
    claimRef.current?.setPlaying(state.isPlaying);
  }, [state.isPlaying, trackId]);
};

export { useMusicSession };
