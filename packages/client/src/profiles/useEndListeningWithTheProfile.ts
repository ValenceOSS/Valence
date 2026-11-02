import { useEffect } from 'react';
import { listenAs, theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';

/**
 * Stops the music and the audiobook once another profile is watching, or the account signs out, so
 * nothing one profile was hearing goes on playing, and counting, as the next; with nothing playing,
 * the server is told nothing. The book's place is not kept here: by now the server speaks for
 * whoever is next, and a profile let go of in this tab kept it before moving on. Whoever is watching
 * is who the book's places are kept for.
 *
 * @param accountId - Who is signed in.
 * @param profileId - The profile watching.
 */
const useEndListeningWithTheProfile = (
  accountId: string | null,
  profileId: string | null,
): void => {
  useEffect(() => {
    listenAs(profileId);
  }, [profileId]);

  useEffect(
    () => () => {
      const music = theMusicPlayer();
      const { queue, remote } = music.read();

      if (queue !== null || remote !== null) {
        music.leave();
      }

      theAudiobookPlayer().close(false);
    },
    [accountId, profileId],
  );
};

export { useEndListeningWithTheProfile };
