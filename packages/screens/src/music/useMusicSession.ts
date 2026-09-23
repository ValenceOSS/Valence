import { useEffect } from 'react';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { artworkTheSystemAccepts } from '@ValenceScreens/playback/artworkTheSystemAccepts';
import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';

const ARTWORK_SIZES = ['256x256', '512x512'] as const;

/**
 * The system's media controls, where this browser offers them.
 *
 * @returns The media session, or nothing.
 */
const theSystemsControls = (): MediaSession | null =>
  typeof navigator.mediaSession === 'object' && typeof MediaMetadata === 'function'
    ? navigator.mediaSession
    : null;

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

  useEffect(() => {
    const session = theSystemsControls();

    if (session === null || trackId === null) {
      return;
    }

    const artwork = albumId === null ? null : artworkTheSystemAccepts(albumArtworkUrl(albumId));

    session.metadata = new MediaMetadata({
      title,
      artist: artists,
      album: albumTitle,
      artwork: artwork === null ? [] : ARTWORK_SIZES.map((sizes) => ({ src: artwork, sizes })),
    });

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
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
    ];

    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        continue;
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          continue;
        }
      }
    };
  }, [trackId, title, artists, albumTitle, albumId, player]);

  useEffect(() => {
    const session = theSystemsControls();

    if (session !== null && trackId !== null) {
      session.playbackState = state.isPlaying ? 'playing' : 'paused';
    }
  }, [state.isPlaying, trackId]);
};

export { useMusicSession };
