import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * A device store held in memory, for tests.
 *
 * @returns The store, and what it holds.
 */
const aFakeStore = (): DeviceStore & { held: Map<string, string> } => {
  const held = new Map<string, string>();

  return {
    held,
    read: (key) => held.get(key) ?? null,
    write: (key, value) => {
      held.set(key, value);
    },
    forget: (key) => {
      held.delete(key);
    },
  };
};

export { aFakeStore };
