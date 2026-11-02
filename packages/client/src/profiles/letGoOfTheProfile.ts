import { closeTheAudiobook, listenAs } from '@ValenceClient/books/theAudiobookPlayer';
import { forgetTheControlledDevice } from '@ValenceClient/video/controlledDevice';
import { profileLetGo } from './profileLetGo';

const WAITS_AT_MOST_MS = 3000;

/**
 * Lets go of everything this device was doing as the profile watching, while the server still
 * speaks for them: their place in an audiobook is saved as theirs, the party they were in is left,
 * and the television this device was the remote for is forgotten. Done after the server has moved
 * on, each of those would land with whoever is next, so nobody is listening here afterwards until
 * the next profile says so. Places kept while offline are theirs and wait for them to be back. A
 * server slow to answer holds things up for a few seconds at most, since somebody signing out has
 * walked away whether or not their place was kept.
 *
 * @param waitsAtMostMs - How long to wait for their place to be saved.
 * @returns Once their place is saved, could not be, or took too long.
 */
const letGoOfTheProfile = async (waitsAtMostMs = WAITS_AT_MOST_MS): Promise<void> => {
  forgetTheControlledDevice();
  profileLetGo.tell();

  let timer: ReturnType<typeof setTimeout> | undefined;

  await Promise.race([
    closeTheAudiobook(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, waitsAtMostMs);
    }),
  ]);
  clearTimeout(timer);
  listenAs(null);
};

export { letGoOfTheProfile };
