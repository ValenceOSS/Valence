import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Lets an element be taken to fill the whole screen and put back, and says whether it is so now
 * and whether the browser will allow it at all — some will not, and a control that does nothing
 * is worse than none.
 *
 * @param target - The element to fill the screen.
 * @returns Whether it fills the screen, whether it could, and the way to change which.
 */
const useFullscreen = (
  target: RefObject<HTMLElement | null>,
): { isFullscreen: boolean; isAvailable: boolean; toggle: () => void } => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsFullscreen(
        document.fullscreenElement !== null && document.fullscreenElement === target.current,
      );
    };

    document.addEventListener('fullscreenchange', sync);

    return () => {
      document.removeEventListener('fullscreenchange', sync);
    };
  }, [target]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement !== null) {
      void document.exitFullscreen();

      return;
    }

    void target.current?.requestFullscreen();
  }, [target]);

  return { isFullscreen, isAvailable: document.fullscreenEnabled, toggle };
};

export { useFullscreen };
