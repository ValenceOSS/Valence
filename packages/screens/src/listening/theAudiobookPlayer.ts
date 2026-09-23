import { createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import { bookAudioUrl, saveListeningProgress } from '@ValenceClient/books/fetchListening';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { takeTurns } from './takeTurns';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

let made: AudiobookPlayer | null = null;
let stopTakingTurns: (() => void) | null = null;

/**
 * The window's audiobook player, made the first time anything asks for it.
 *
 * One audio element for the whole window, beside the music's own, so a book carries on while
 * somebody browses. It takes turns with the music, each pausing the other as it starts.
 *
 * @returns The player.
 */
const theAudiobookPlayer = (): AudiobookPlayer => {
  if (made !== null) {
    return made;
  }

  const audio = new Audio();

  audio.preload = 'auto';

  made = createAudiobookPlayer({
    audio,
    addressOf: bookAudioUrl,
    save: (bookId, place) => {
      void saveListeningProgress(bookId, place);
    },
    now: () => Date.now(),
  });
  stopTakingTurns = takeTurns(made, theMusicPlayer());

  return made;
};

/**
 * Forgets the window's audiobook player, so a test starts from nothing.
 */
const forgetTheAudiobookPlayer = (): void => {
  stopTakingTurns?.();
  stopTakingTurns = null;
  made = null;
};

export { forgetTheAudiobookPlayer, theAudiobookPlayer };
