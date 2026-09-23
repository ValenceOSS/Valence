import { AppState } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Tells the shared cache when the app comes back to the screen, which a browser tells it by itself
 * and a television does not.
 *
 * What is read again on coming back includes who is signed in, so a television left on the home
 * screen overnight, whose sign-in ran out meanwhile, asks who is watching rather than going on
 * showing a library it can no longer open.
 */
const tellQueriesWhenOnScreen = (): void => {
  focusManager.setEventListener((setFocused) => {
    const listening = AppState.addEventListener('change', (state) => {
      setFocused(state === 'active');
    });

    return () => {
      listening.remove();
    };
  });
};

export { tellQueriesWhenOnScreen };
