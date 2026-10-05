import { useEffect, useRef, useState } from 'react';
import type { RouterHistory } from '@tanstack/react-router';

type FollowedHistory = Pick<RouterHistory, 'location' | 'subscribe' | 'back' | 'forward'>;

type HistoryWays = {
  canGoBack: boolean;
  canGoForward: boolean;
  back: () => void;
  forward: () => void;
};

/**
 * Which ways a window's history goes from where it is, for a back and a forward button that dim
 * where there is nowhere to go. A history knows how far back it reaches by its own index; how far
 * forward is remembered here, as the furthest it has been since a new page was last pushed, since
 * pushing one throws away whatever lay ahead.
 *
 * @param history - The history to follow.
 * @returns Whether it can go back or forward, and the way to go each.
 */
const useHistoryWays = (history: FollowedHistory): HistoryWays => {
  const [at, setAt] = useState(() => history.location.state.__TSR_index);
  const furthest = useRef(at);
  const [ahead, setAhead] = useState(at);

  useEffect(
    () =>
      history.subscribe(({ location, action }) => {
        const index = location.state.__TSR_index;

        furthest.current = action.type === 'PUSH' ? index : Math.max(furthest.current, index);
        setAt(index);
        setAhead(furthest.current);
      }),
    [history],
  );

  return {
    canGoBack: at > 0,
    canGoForward: at < ahead,
    back: () => {
      history.back();
    },
    forward: () => {
      history.forward();
    },
  };
};

export { useHistoryWays };
