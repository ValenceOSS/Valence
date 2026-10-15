import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

let isAdding = false;

/**
 * Says whether somebody already signed in has asked to sign another account in beside theirs.
 *
 * @param next - Whether they are.
 */
const setAddingAnotherAccount = (next: boolean): void => {
  isAdding = next;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Follows whether somebody already signed in is signing another account in beside theirs, which is
 * when the way in is drawn over the app rather than in place of it.
 *
 * @returns Whether they are.
 */
const useAddingAnotherAccount = (): boolean =>
  useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);

      return () => {
        listeners.delete(onChange);
      };
    },
    () => isAdding,
  );

export { setAddingAnotherAccount, useAddingAnotherAccount };
