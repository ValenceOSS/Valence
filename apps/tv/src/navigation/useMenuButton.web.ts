import { useEffect } from 'react';
import { backPresses } from '@ValenceTv/navigation/backPresses';
import { buttonOfKey } from '@ValenceTv/remote/buttonOfKey';
import type { useMenuButton as onTheTelevision } from '@ValenceTv/navigation/useMenuButton';

let isListening = false;

/**
 * Hears the remote's Back button for the whole page, once, handing each press to whatever asked
 * for it most recently.
 *
 * @param page - The page.
 */
const listenForBack = (page: Document): void => {
  if (isListening) {
    return;
  }

  isListening = true;
  page.addEventListener('keydown', (event) => {
    const isTyping = page.activeElement instanceof HTMLInputElement && event.key === 'Backspace';
    const back = backPresses[backPresses.length - 1];

    if (isTyping || back === undefined || buttonOfKey(event.key, event.keyCode) !== 'back') {
      return;
    }

    event.preventDefault();
    back();
  });
};

/**
 * Takes the remote's Back button to mean "back a step" in a television's browser, while there is a
 * step to go back to; the most recent screen to ask hears it first, as on tvOS and Android TV.
 *
 * @param back - What going back does, or nothing where this is as far back as it goes.
 */
const useMenuButton: typeof onTheTelevision = (back) => {
  useEffect(() => {
    listenForBack(document);

    if (back === null) {
      return;
    }

    backPresses.push(back);

    return () => {
      const at = backPresses.lastIndexOf(back);

      if (at >= 0) {
        backPresses.splice(at, 1);
      }
    };
  }, [back]);
};

export { useMenuButton };
