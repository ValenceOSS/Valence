import { createKeptListening } from '@ValenceClient/downloads/createKeptListening';
import type { KeptListeningShelfKeeper } from '@ValenceClient/downloads/createKeptListening';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

let made: KeptListeningShelfKeeper | null = null;

/**
 * The music and audiobooks this device keeps, made the first time anything asks, and set fetching
 * whatever it was fetching when the app last closed.
 *
 * @returns What keeps them.
 */
const theKeptListening = (): KeptListeningShelfKeeper => {
  if (made !== null) {
    return made;
  }

  const platform = platformInUse();

  made = createKeptListening({
    store: platform.store,
    files: platform.listeningFiles,
    server: platform.serverAddress,
    now: () => Date.now(),
  });
  made.carryOn();

  return made;
};

/**
 * Forgets what keeps this device's music and audiobooks, so a test starts from nothing.
 */
const forgetTheKeptListening = (): void => {
  made = null;
};

export { forgetTheKeptListening, theKeptListening };
