import { useEffect } from 'react';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';

/**
 * Stops the music and the audiobook once another profile is watching, or the account signs out, so
 * nothing one profile was hearing goes on playing, and counting, as the next; with nothing playing,
 * the server is told nothing.
 *
 * @param accountId - Who is signed in.
 * @param profileId - The profile watching.
 */
const useEndListeningWithTheProfile = (
  accountId: string | null,
  profileId: string | null,
): void => {
  useEffect(
    () => () => {
      const music = theMusicPlayer();
      const { queue, remote } = music.read();

      if (queue !== null || remote !== null) {
        music.leave();
      }

      theAudiobookPlayer().close();
    },
    [accountId, profileId],
  );
};

export { useEndListeningWithTheProfile };
