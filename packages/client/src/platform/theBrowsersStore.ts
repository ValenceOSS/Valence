import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import type { KeptStorage } from '@ValenceClient/platform/KeptStorage';

/**
 * Where this client keeps what belongs to the device rather than to the account — which profile is
 * watching, the quality somebody pinned, how large they like the grid.
 *
 * Every read and write is guarded, because `localStorage` is not always there to be written to: a
 * private window, a browser configured to refuse it, or a quota already full all throw rather than
 * answer. None of that is worth failing a page over, so a store that cannot remember behaves as one
 * that has nothing to remember.
 *
 * The storage is handed in rather than found, since this package does not know it is in a browser;
 * the web app and a television's browser each hand it their `localStorage`, read at the moment of
 * asking, as reaching it can itself throw.
 *
 * @param storage - How to reach the browser's storage.
 * @returns The store, for the platform to be installed with.
 */
const theBrowsersStore = (storage: () => KeptStorage): DeviceStore => ({
  read: (key) => {
    try {
      return storage().getItem(key);
    } catch {
      return null;
    }
  },
  write: (key, value) => {
    try {
      storage().setItem(key, value);
    } catch {}
  },
  forget: (key) => {
    try {
      storage().removeItem(key);
    } catch {}
  },
});

export { theBrowsersStore };
