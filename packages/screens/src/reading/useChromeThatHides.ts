import { useCallback, useEffect, useRef, useState } from 'react';

const LINGERS_MS = 2600;

const WAKES_WITHIN_PX = 96;

/**
 * Controls that are there when they are wanted and gone when they are not.
 *
 * A reader's page is the whole point of its screen, so its controls show on arrival, stay while
 * somebody is doing something, and fade once they have been left alone for a moment — the way the
 * player's do. Waking them again is a tap in the middle of the page, a moved pointer or a change
 * to the settings. Turning the page is not: it puts them away at once, since somebody leafing
 * through a book wants the page and nothing over it.
 *
 * A click on the page itself puts them away, or brings them back, as a tap does on a phone. Once put
 * away, a pointer moving over the page leaves them away; it has to come to the top or bottom of the
 * screen, where they live, to bring them back.
 *
 * @returns Whether the controls are showing, the way to show them again, the way to keep them
 *   showing without showing them, the way to put them away or bring them back, the way to put them
 *   away at once, and what a moving pointer does to them.
 */
const useChromeThatHides = (): {
  isShown: boolean;
  wake: () => void;
  keep: () => void;
  toggle: () => void;
  hide: () => void;
  follow: (event: { clientY: number }) => void;
} => {
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

  const hide = useCallback(() => {
    if (hideAt.current !== null) {
      clearTimeout(hideAt.current);
      hideAt.current = null;
    }

    isShownRef.current = false;
    setIsShown(false);
  }, []);

  const toggle = useCallback(() => {
    if (isShownRef.current) {
      hide();
    } else {
      wake();
    }
  }, [hide, wake]);

  const follow = useCallback(
    (event: { clientY: number }) => {
      const isNearABar =
        event.clientY < WAKES_WITHIN_PX || event.clientY > window.innerHeight - WAKES_WITHIN_PX;

      if (isNearABar) {
        wake();
      } else {
        keep();
      }
    },
    [keep, wake],
  );

  useEffect(() => {
    wake();

    return () => {
      if (hideAt.current !== null) {
        clearTimeout(hideAt.current);
      }
    };
  }, [wake]);

  return { isShown, wake, keep, toggle, hide, follow };
};

export { useChromeThatHides };
