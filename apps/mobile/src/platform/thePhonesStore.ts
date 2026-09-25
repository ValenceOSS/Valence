import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * Where a phone keeps what belongs to the device rather than to the account — which server it
 * watches, which profile is watching, the quality somebody pinned.
 *
 * Answers from the copy taken before the application started, and writes to both that copy and the
 * storage behind it. A write that has not reached the disk yet is still the truth as far as
 * anything reading is concerned, which is what lets a preference be set and read in the same
 * breath.
 *
 * A write that fails is dropped rather than thrown. Losing a preference is a small thing; taking
 * down whatever was setting it is not.
 *
 * @param held - What the phone remembered, read at startup.
 * @returns The store.
 */
const thePhonesStore = (held: Map<string, string>): DeviceStore => ({
  read: (key) => held.get(key) ?? null,
  write: (key, value) => {
    held.set(key, value);
    void AsyncStorage.setItem(key, value).catch(() => undefined);
  },
  forget: (key) => {
    held.delete(key);
    void AsyncStorage.removeItem(key).catch(() => undefined);
  },
});

export { thePhonesStore };
