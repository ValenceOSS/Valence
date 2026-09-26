import { useEffect } from 'react';

const UNDER = 'valenceWayIn';

/**
 * Lets the page it is on run up under the desktop's window bar, with the bar gone clear over it,
 * for as long as it is showing: the way in is one picture from edge to edge, and a strip across its
 * top belongs to the application somebody has not reached yet.
 */
const useUnderTheWindowBar = (): void => {
  useEffect(() => {
    const page = document.documentElement;

    page.dataset[UNDER] = 'true';

    return () => {
      delete page.dataset[UNDER];
    };
  }, []);
};

export { useUnderTheWindowBar };
