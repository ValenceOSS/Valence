import { useEffect } from 'react';

const ON_THE_FRAME = 'valenceOnTheFrame';

/**
 * Draws the desktop's window bar in the colour of the frame the page sits in, with no line beneath
 * it, for as long as the page is showing — so the admin area's frame runs up to the top of the
 * window rather than stopping under a strip of another colour.
 */
const useWindowBarOnTheFrame = (): void => {
  useEffect(() => {
    const page = document.documentElement;

    page.dataset[ON_THE_FRAME] = 'true';

    return () => {
      delete page.dataset[ON_THE_FRAME];
    };
  }, []);
};

export { useWindowBarOnTheFrame };
