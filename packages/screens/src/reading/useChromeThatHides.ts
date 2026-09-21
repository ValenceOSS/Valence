import { useCallback, useEffect, useRef, useState } from 'react';

const LINGERS_MS = 2600;

/**
 * Controls that are there when they are wanted and gone when they are not.
 *
 * A reader's page is the whole point of its screen, so its controls show on arrival, stay while
 * somebody is doing something, and fade once they have been left alone for a moment — the way the
 * player's do. Waking them again is a tap in the middle of the page, a moved pointer or a change
 * to the settings. Turning the page is not: somebody reading who has let the controls fade should
 * not have them thrown back over the page every time they turn it, so a turn only keeps them a
 * moment longer where they are already showing.
 *
 * @returns Whether the controls are showing, the way to show them again, and the way to keep them
 *   showing without showing them.
 */
const useChromeThatHides = (): { isShown: boolean; wake: () => void; keep: () => void } => {
  const [isShown, setIsShown] = useState(true);
  const isShownRef = useRef(true);
  const hideAt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wake = useCallback(() => {
    isShownRef.current = true;
    setIsShown(true);

    if (hideAt.current !== null) {
      clearTimeout(hideAt.current);
    }

    hideAt.current = setTimeout(() => {
      isShownRef.current = false;
      setIsShown(false);
    }, LINGERS_MS);
  }, []);

  const keep = useCallback(() => {
    if (isShownRef.current) {
      wake();
    }
  }, [wake]);

  useEffect(() => {
    wake();

    return () => {
      if (hideAt.current !== null) {
        clearTimeout(hideAt.current);
      }
    };
  }, [wake]);

  return { isShown, wake, keep };
};

export { useChromeThatHides };
