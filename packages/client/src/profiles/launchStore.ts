import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const remembered = new Map<string, string>();

const IN_MEMORY: DeviceStore = {
  read: (key) => remembered.get(key) ?? null,
  write: (key, value) => {
    remembered.set(key, value);
  },
  forget: (key) => {
    remembered.delete(key);
  },
};

/**
 * What lasts only while the app is open: a browser tab's session where the platform keeps one, and
 * otherwise memory, which the next start of the app begins without.
 *
 * @returns The store.
 */
const launchStore = (): DeviceStore => platformInUse().thisLaunch ?? IN_MEMORY;

export { launchStore };
