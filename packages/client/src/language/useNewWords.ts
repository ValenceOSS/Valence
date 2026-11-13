import { useSyncExternalStore } from 'react';
import { NEW_WORDS } from './NEW_WORDS';

/**
 * Counts the times the app has started speaking new words, for the root of an app to key what it
 * draws on, so everything is drawn again in the new words.
 *
 * @returns How many times so far.
 */
const useNewWords = (): number =>
  useSyncExternalStore(
    (listener) => {
      NEW_WORDS.listeners.add(listener);

      return () => {
        NEW_WORDS.listeners.delete(listener);
      };
    },
    () => NEW_WORDS.told,
    () => NEW_WORDS.told,
  );

export { useNewWords };
