import { useEffect, useRef } from 'react';
import { HOME } from '@ValenceClient/navigation/readLocation';
import type { Place } from '@ValenceClient/navigation/readLocation';

/**
 * Goes home as another profile takes over this tab, so nothing the last one had open — what they
 * searched for, the title they were looking at, the party they were in — shows to the next. The
 * first profile to arrive is left wherever the address put them, and so is one whose picker merely
 * came and went.
 *
 * @param watcherId - The profile watching, or nobody while that is being asked.
 * @param replace - Moves the page without adding a step to go back to.
 */
const useHomeForAnotherProfile = (
  watcherId: string | null,
  replace: (change: Partial<Place>) => void,
): void => {
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (watcherId === null) {
      return;
    }

    if (last.current !== null && last.current !== watcherId) {
      replace(HOME);
    }

    last.current = watcherId;
  }, [watcherId, replace]);
};

export { useHomeForAnotherProfile };
