import { useEffect } from 'react';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

/**
 * Lets an administrator pause, resume or stop the audiobook this device is playing, as they can a
 * film or a song. Mounted once for a signed-in window; the command arrives through presence.
 *
 * @param player - The player commands go to, which is the window's own unless a test says otherwise.
 */
const useAudiobookRemote = (player: AudiobookPlayer = theAudiobookPlayer()): void => {
  useEffect(
    () =>
      onPresenceEvent((event) => {
        if (event.kind !== 'book') {
          return;
        }

        if (event.command === 'pause') {
          player.pause();
        } else if (event.command === 'resume') {
          player.play();
        } else {
          player.close();
        }
      }),
    [player],
  );
};

export { useAudiobookRemote };
