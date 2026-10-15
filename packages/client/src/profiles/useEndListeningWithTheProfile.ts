import { useEffect } from 'react';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';

/**
 * Stops the music and the audiobook once another profile is watching, or the account signs out, so
 * nothing one profile was hearing goes on playing, and counting, as the next.
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
      theMusicPlayer().leave();
      theAudiobookPlayer().close();
    },
    [accountId, profileId],
  );
};

export { useEndListeningWithTheProfile };
