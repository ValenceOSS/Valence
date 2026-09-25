import { createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import { bookAudioUrl, saveListeningProgress } from '@ValenceClient/books/fetchListening';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { heardLast } from '@ValenceClient/books/heardLast';
import { listeningKept } from '@ValenceClient/books/listeningKept';
import { takeTurns } from '@ValenceClient/books/takeTurns';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

let made: AudiobookPlayer | null = null;
let stopTakingTurns: (() => void) | null = null;

/**
 * The client's audiobook player, made the first time anything asks for it.
 *
 * One player for the whole client, playing through whatever audio the host hands over beside the
 * music's own, so a book carries on while somebody browses. It takes turns with the music, each
 * pausing the other as it starts, and remembers which was heard last. Each place it keeps is told
 * once the server has it, for whatever shows where somebody is to read it again.
 *
 * @returns The player.
 */
const theAudiobookPlayer = (): AudiobookPlayer => {
  if (made !== null) {
    return made;
  }

  made = createAudiobookPlayer({
    audio: platformInUse().listeningAudio(),
    addressOf: bookAudioUrl,
    save: (bookId, place) => {
      void saveListeningProgress(bookId, place).then((isKept) => {
        if (isKept) {
          listeningKept.tell(bookId);
        }
      });
    },
    now: () => Date.now(),
  });
  stopTakingTurns = takeTurns(made, theMusicPlayer(), (which) => {
    heardLast.hear(which === 'one' ? 'book' : 'music');
  });

  return made;
};

/**
 * Forgets the client's audiobook player, closing whatever it was playing, so somebody signing out
 * leaves nothing talking and a test starts from nothing.
 */
const forgetTheAudiobookPlayer = (): void => {
  stopTakingTurns?.();
  stopTakingTurns = null;
  made?.close();
  made = null;
  heardLast.forget();
};

export { forgetTheAudiobookPlayer, theAudiobookPlayer };
