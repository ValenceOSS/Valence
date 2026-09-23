import * as SecureStore from 'expo-secure-store';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

/**
 * Where this television keeps what belongs to it rather than to an account — which server it watches,
 * which profile is watching, the servers it has used.
 *
 * The keychain rather than a file, because one of these values is the address of somebody's home
 * server. It is read synchronously, which the keychain supports and the application needs: a
 * preference is read while something is being drawn.
 *
 * A copy is kept in memory beside it, because forgetting a key is the one thing the keychain will not
 * do synchronously — a key dropped and read back in the same frame would otherwise still be there.
 *
 * @returns The store, for the platform to be installed with.
 */
const theTvsStore = (): DeviceStore => {
  const held = new Map<string, string | null>();

  return {
    read: (key) => {
      const remembered = held.get(key);

      if (remembered !== undefined) {
        return remembered;
      }

      try {
        const value = SecureStore.getItem(key);

        held.set(key, value);

        return value;
      } catch {
        return null;
      }
    },
    write: (key, value) => {
      held.set(key, value);

      try {
        SecureStore.setItem(key, value);
      } catch {}
    },
    forget: (key) => {
      held.set(key, null);

      void SecureStore.deleteItemAsync(key).catch(() => undefined);
    },
  };
};

export { theTvsStore };
