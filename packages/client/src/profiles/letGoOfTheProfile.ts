import {
  closeTheAudiobook,
  listenAs,
  whoIsListening,
} from '@ValenceClient/books/theAudiobookPlayer';
import { sendListenedOffline } from '@ValenceClient/offline/listenedOffline';
import { forgetTheControlledDevice } from '@ValenceClient/video/controlledDevice';
import { profileLetGo } from './profileLetGo';

const WAITS_AT_MOST_MS = 3000;

/**
 * Saves the place in the book that was playing, and any places kept while offline, as the profile
 * watching.
 *
 * @returns Once they are saved, or could not be.
 */
const keepTheirPlaces = async (): Promise<void> => {
  const listening = whoIsListening();

  await closeTheAudiobook();
  await sendListenedOffline(listening).catch(() => 0);
};

/**
 * Lets go of everything this device was doing as the profile watching, while the server still
 * speaks for them: their place in an audiobook and any places kept while offline are saved as
 * theirs, the party they were in is left, and the television this device was the remote for is
 * forgotten. Done after the server has moved on, each of those would land with whoever is next, so
 * nobody is listening here afterwards until the next profile says so. A
 * server slow to answer holds things up for a few seconds at most, since somebody signing out has
 * walked away whether or not their place was kept.
 *
 * @param waitsAtMostMs - How long to wait for their places to be saved.
 * @returns Once their places are saved, could not be, or took too long.
 */
const letGoOfTheProfile = async (waitsAtMostMs = WAITS_AT_MOST_MS): Promise<void> => {
  forgetTheControlledDevice();
  profileLetGo.tell();

  let timer: ReturnType<typeof setTimeout> | undefined;

  await Promise.race([
    keepTheirPlaces(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, waitsAtMostMs);
    }),
  ]);
  clearTimeout(timer);
  listenAs(null);
};

export { letGoOfTheProfile };
