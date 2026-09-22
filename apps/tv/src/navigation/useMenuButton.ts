import { useEffect } from 'react';
import { BackHandler, TVEventControl } from 'react-native';

/**
 * Takes the remote's Menu button to mean "back a step", while there is a step to go back to.
 *
 * tvOS gives Menu to the system unless an app asks for it, and the system answers by leaving the app.
 * So it is asked for only while a screen has somewhere to go back to: on the first screen Menu does
 * what it does everywhere else on the television, and leaves.
 *
 * Something open inside a screen — a menu over the player — can hear Menu first without taking the
 * button for itself, since the screen around it already has; the most recent listener hears it
 * first, and closing is all it does.
 *
 * @param back - What going back does, or nothing where this is as far back as it goes.
 * @param isInside - Whether this is inside a screen that already holds the button.
 */
const useMenuButton = (back: (() => void) | null, isInside = false): void => {
  useEffect(() => {
    if (back === null) {
      if (!isInside) {
        TVEventControl.disableTVMenuKey();
      }

      return;
    }

    if (!isInside) {
      TVEventControl.enableTVMenuKey();
    }

    const listening = BackHandler.addEventListener('hardwareBackPress', () => {
      back();

      return true;
    });

    return () => {
      listening.remove();
    };
  }, [back, isInside]);
};

export { useMenuButton };
