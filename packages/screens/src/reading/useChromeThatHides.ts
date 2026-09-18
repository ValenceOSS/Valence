import { useCallback, useEffect, useRef, useState } from 'react';

const LINGERS_MS = 2600;

/**
 * Controls that are there when they are wanted and gone when they are not.
 *
 * A reader's page is the whole point of its screen, so its controls show on arrival, stay while
 * somebody is doing something, and fade once they have been left alone for a moment — the way the
 * player's do. Waking them again is anything a reader does: a tap, a turn, a moved pointer.
 *
 * @returns Whether the controls are showing, and the way to show them again.
 */
const useChromeThatHides = (): { isShown: boolean; wake: () => void } => {
  const [isShown, setIsShown] = useState(true);
  const hideAt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wake = useCallback(() => {
    setIsShown(true);

    if (hideAt.current !== null) {
      clearTimeout(hideAt.current);
    }

    hideAt.current = setTimeout(() => {
      setIsShown(false);
    }, LINGERS_MS);
  }, []);

  useEffect(() => {
    wake();

    return () => {
      if (hideAt.current !== null) {
        clearTimeout(hideAt.current);
      }
    };
  }, [wake]);

  return { isShown, wake };
};

export { useChromeThatHides };
