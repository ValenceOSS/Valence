import { NEW_WORDS } from './NEW_WORDS';

/**
 * Tells whatever draws the app that it is speaking new words, so it can draw itself again in them.
 */
const tellOfNewWords = (): void => {
  NEW_WORDS.told += 1;
  NEW_WORDS.listeners.forEach((listener) => {
    listener();
  });
};

export { tellOfNewWords };
