import { useEffect, useState } from 'react';
import { fittedTo } from '@ValenceTv/platform/fittedTo';
import type { useTheScreen as onTheTelevision } from '@ValenceTv/platform/useTheScreen';

/**
 * The screen a television's browser lays the TV layout out on: 1920 points across whatever the
 * window, as the page is scaled to fill it, so the layout comes out the same on every television.
 *
 * @returns How wide and tall it is.
 */
const useTheScreen: typeof onTheTelevision = () => {
  const [screen, setScreen] = useState(() => fittedTo(window.innerWidth, window.innerHeight));

  useEffect(() => {
    const refit = (): void => {
      setScreen(fittedTo(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', refit);

    return () => {
      window.removeEventListener('resize', refit);
    };
  }, []);

  return { width: screen.width, height: screen.height };
};

export { useTheScreen };
