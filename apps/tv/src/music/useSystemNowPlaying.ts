import { useEffect } from 'react';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { theTvsMusicPlayer } from '@ValenceTv/music/theTvsMusicAudio';

/**
 * Tells the television what song this app is playing, so the system shows it as what is playing —
 * in the Control Centre, when the screen dims, when the song changes — and its own play, pause and
 * scrubbing reach the song. It is told once each time the song changes rather than as it plays,
 * and forgets it once nothing plays here, including while this television is only a remote for
 * another device, while a book is the one being heard, or once the app stops listening for it.
 *
 * @param isHeard - Whether the music, rather than a book, is the one being heard.
 */
const useSystemNowPlaying = (isHeard: boolean): void => {
  const { state } = useMusicPlayer(theMusicPlayer());
  const { current, remote } = state;
  const isHere = remote === null && isHeard;

  useEffect(() => {
    const system = theTvsMusicPlayer();

    if (current === null || !isHere) {
      system.clearLockScreenControls();

      return;
    }

    system.setActiveForLockScreen(
      true,
      {
        title: current.title,
        artist: current.artists.map((artist) => artist.name).join(', '),
        albumTitle: current.album.title,
      },
      { showSeekBackward: true, showSeekForward: true },
    );
  }, [current, isHere]);

  useEffect(
    () => () => {
      theTvsMusicPlayer().clearLockScreenControls();
    },
    [],
  );
};

export { useSystemNowPlaying };
