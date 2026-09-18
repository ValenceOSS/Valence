import type { MusicPlayerState } from './createMusicPlayer';
import type { MusicView } from './musicView';

/**
 * Whether the music playing is coming from a page of the music section, so the page can be marked
 * wherever it is listed.
 *
 * An album is playing whenever the song playing is on it, however that song came to be playing; an
 * artist, a playlist or the liked songs only when that is what the queue was started from, since a
 * song belongs to many of those at once.
 *
 * @param view - The page.
 * @param state - What the player is doing.
 * @returns Whether the music playing is coming from it.
 */
const isPlayingFrom = (
  view: MusicView,
  state: Pick<MusicPlayerState, 'current' | 'queue'>,
): boolean => {
  if (view.kind === 'album') {
    return state.current?.album.id === view.id;
  }

  const source = state.queue?.source ?? null;

  if (source === null || state.current === null) {
    return false;
  }

  if (view.kind === 'liked') {
    return source.kind === 'liked';
  }

  return (
    (view.kind === 'artist' || view.kind === 'playlist') &&
    source.kind === view.kind &&
    source.id === view.id
  );
};

export { isPlayingFrom };
