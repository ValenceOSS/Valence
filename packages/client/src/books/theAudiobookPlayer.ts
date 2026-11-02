import { createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import { bookAudioUrl, saveListeningProgress } from '@ValenceClient/books/fetchListening';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { heardLast } from '@ValenceClient/books/heardLast';
import { listeningKept } from '@ValenceClient/books/listeningKept';
import { takeTurns } from '@ValenceClient/books/takeTurns';
import { watchNowListening } from '@ValenceClient/books/watchNowListening';
import {
  forgetListenedOffline,
  rememberListenedOffline,
} from '@ValenceClient/offline/listenedOffline';
import { reportNowListening } from '@ValenceClient/books/bookDevices';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

let made: AudiobookPlayer | null = null;
let stopTakingTurns: (() => void) | null = null;
let stopReporting: (() => void) | null = null;
let releaseTheAudio: (() => void) | null = null;

const saving = new Set<Promise<void>>();

let listener: string | null = null;

/**
 * The client's audiobook player, made the first time anything asks for it.
 *
 * One player for the whole client, playing through whatever audio the host hands over beside the
 * music's own, so a book carries on while somebody browses. It takes turns with the music, each
 * pausing the other as it starts, and remembers which was heard last. Each place it keeps is told
 * once the server has it, for whatever shows where somebody is to read it again, and what it is
 * playing is reported as it plays, for an administrator watching the server.
 *
 * @returns The player.
 */
const theAudiobookPlayer = (): AudiobookPlayer => {
  if (made !== null) {
    return made;
  }

  const audio = platformInUse().listeningAudio();

  releaseTheAudio = audio.release ?? null;
  made = createAudiobookPlayer({
    audio,
    addressOf: (bookId, chapterId) =>
      theKeptListening().chapterAddress(chapterId) ?? bookAudioUrl(bookId, chapterId),
    save: (bookId, place) => {
      const as = listener;
      const saved = saveListeningProgress(bookId, place).then((isKept) => {
        if (isKept) {
          forgetListenedOffline(bookId, as);
          listeningKept.tell(bookId);
        } else {
          rememberListenedOffline(bookId, place, Date.now(), as);
        }
      });

      saving.add(saved);
      void saved.finally(() => {
        saving.delete(saved);
      });
    },
    now: () => Date.now(),
  });
  stopTakingTurns = takeTurns(made, theMusicPlayer(), (which) => {
    heardLast.hear(which === 'one' ? 'book' : 'music');
  });
  stopReporting = watchNowListening(
    made,
    (nowListening) => {
      void reportNowListening(nowListening);
    },
    () => Date.now(),
  );

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
  stopReporting?.();
  stopReporting = null;
  made = null;
  releaseTheAudio?.();
  releaseTheAudio = null;
  heardLast.forget();
};

/**
 * Closes whatever book is playing, keeping the place it got to, without making a player where there
 * is none.
 *
 * @returns Once every place the player was keeping has been saved, or could not be.
 */
const closeTheAudiobook = async (): Promise<void> => {
  made?.close();
  await Promise.allSettled(saving);
};

/**
 * Says which profile is listening on this device, so a place the server could not be told is kept
 * as theirs, and only ever told to the server as theirs.
 *
 * @param profileId - The profile, or nobody.
 */
const listenAs = (profileId: string | null): void => {
  listener = profileId;
};

/**
 * Which profile is listening on this device, as last said.
 *
 * @returns The profile, or nobody.
 */
const whoIsListening = (): string | null => listener;

export {
  closeTheAudiobook,
  forgetTheAudiobookPlayer,
  listenAs,
  theAudiobookPlayer,
  whoIsListening,
};
