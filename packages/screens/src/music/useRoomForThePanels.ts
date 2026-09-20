import { useEffect, useState } from 'react';

const WIDE_FROM = '(min-width: 64rem)';

/**
 * Whether the page is wide enough to stand the music library and the side panels beside the page,
 * which is the large breakpoint. Below it they are drawers, opened when asked for, since a column
 * squeezed into a phone's width is a sliver nobody can use.
 *
 * Answers true where there is no `matchMedia` to ask, since a test environment is better served by
 * the arrangement that has room.
 *
 * @returns Whether there is room for the panels beside the page.
 */
const useRoomForThePanels = (): boolean => {
  const [hasRoom, setHasRoom] = useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
      ? true
      : window.matchMedia(WIDE_FROM).matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return;
    }

    const asked = window.matchMedia(WIDE_FROM);

    const answer = (): void => {
      setHasRoom(asked.matches);
    };

    answer();

    asked.addEventListener('change', answer);

    return () => {
      asked.removeEventListener('change', answer);
    };
  }, []);

  return hasRoom;
};

export { useRoomForThePanels };
