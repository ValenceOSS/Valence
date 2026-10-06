import { useEffect } from 'react';
import { buttonOfKey } from '@ValenceTv/remote/buttonOfKey';
import type { useRemote as onTheTelevision } from '@ValenceTv/remote/useRemote';

const HOLDABLE = new Set(['left', 'right', 'select', 'playPause']);

/**
 * The name the Siri Remote gives a button held down, as `longLeft` for left.
 *
 * @param button - The button.
 * @returns Its held name.
 */
const heldNameOf = (button: string): string =>
  `long${button.charAt(0).toUpperCase()}${button.slice(1)}`;

/**
 * Tells a screen what the remote's buttons do in a television's browser, said as the Siri Remote
 * says them: each press as it goes down, and a button held down as its held name, once as it is
 * held and again as it is let go.
 *
 * @param hear - Told of each button pressed or held.
 */
const useRemote: typeof onTheTelevision = (hear) => {
  useEffect(() => {
    const held = new Set<string>();
    const down = (event: KeyboardEvent) => {
      const button = buttonOfKey(event.key, event.keyCode);

      if (button === null) {
        return;
      }

      if (!event.repeat) {
        hear({ eventType: button, eventKeyAction: 0 });

        return;
      }

      if (HOLDABLE.has(button) && !held.has(button)) {
        held.add(button);
        hear({ eventType: heldNameOf(button), eventKeyAction: 0 });
      }
    };
    const up = (event: KeyboardEvent) => {
      const button = buttonOfKey(event.key, event.keyCode);

      if (button !== null && held.delete(button)) {
        hear({ eventType: heldNameOf(button), eventKeyAction: 1 });
      }
    };

    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);

    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, [hear]);
};

export { useRemote };
