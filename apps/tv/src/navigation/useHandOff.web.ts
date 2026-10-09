import { useCallback, useRef } from 'react';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import type { useHandOff as onTheTelevision } from '@ValenceTv/navigation/useHandOff';

/**
 * Hands the remote to one item when it is on a given edge and the remote is pressed that way, in a
 * television's browser: up from the top of a page to the bar, or down from the bar onto the front
 * page's buttons.
 *
 * On a television this listens for the press. In a browser the focus engine has already moved the
 * remote by the time anything else hears the key, so a listener lost the race and the remote went
 * wherever lay nearest instead, such as up from the front page onto the search pill, which opens
 * search. So arriving on the edge tells the focus engine directly where that press goes, and leaving
 * takes it back.
 *
 * @param heading - Which way the remote is pressed.
 * @param target - What takes the remote, or nothing to leave the focus engine to find its own way.
 * @returns What to call as the remote arrives on the edge, and as it leaves.
 */
const useHandOff: typeof onTheTelevision = (heading, target) => {
  const edge = useRef<HTMLElement | null>(null);

  const leave = useCallback(() => {
    const was = edge.current;

    edge.current = null;

    if (was === null) {
      return;
    }

    const kept = Object.entries(nextFocusOverrides.get(was) ?? {}).filter(
      ([direction]) => direction !== heading,
    );

    if (kept.length === 0) {
      nextFocusOverrides.delete(was);
    } else {
      nextFocusOverrides.set(was, Object.fromEntries(kept));
    }
  }, [heading]);

  const arrive = useCallback(() => {
    const here = document.activeElement;

    leave();

    if (!(here instanceof HTMLElement) || !(target instanceof HTMLElement)) {
      return;
    }

    edge.current = here;
    nextFocusOverrides.set(here, { ...nextFocusOverrides.get(here), [heading]: target });
  }, [heading, target, leave]);

  return { arrive, leave };
};

export { useHandOff };
