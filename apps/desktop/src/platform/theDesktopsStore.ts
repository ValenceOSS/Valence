import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import type { Preferences } from '@ValenceDesktop/TheWindow.types';

/**
 * Keeps what belongs to the machine rather than the account in a file the host holds, answering
 * reads at once from a copy of what the page was booted with and writing through to the file.
 *
 * @param preferences - What the page was booted with: the file's, or this launch's.
 * @returns The store.
 */
const theDesktopsStore = (preferences: Preferences): DeviceStore => {
  const held = new Map(Object.entries(preferences.held));

  return {
    read: (key) => held.get(key) ?? null,
    write: (key, value) => {
      held.set(key, value);
      preferences.write(key, value);
    },
    forget: (key) => {
      held.delete(key);
      preferences.forget(key);
    },
  };
};

export { theDesktopsStore };
