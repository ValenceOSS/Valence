import { useCallback, useRef } from 'react';
import { useTVEventHandler } from 'react-native';
import type { HWEvent, View } from 'react-native';

const SAME_PRESS_MS = 150;

/**
 * Hands the remote to one item when it is on a given edge and the remote is pressed that way — up
 * from the top of a page to the bar, or down from the bar onto the front page's buttons.
 *
 * The bar floats over the page, centred, and the television only moves the remote to what lies in
 * line with it, so between the two Up and Down would often go nowhere. Guides laid across the page
 * to catch it can themselves be landed on, and a guide pinned beside an item inside a scrolling page
 * is left behind once the page scrolls. Asking the item to take the remote does neither.
 *
 * The press that brings the remote onto the edge is heard only after it has arrived, so a press heard
 * straight after arriving is taken to be that one, and does not carry the remote on past the edge.
 *
 * @param heading - Which way the remote is pressed.
 * @param target - What takes the remote, or nothing to leave the television to find its own way.
 * @returns What to call as the remote arrives on the edge, and as it leaves.
 */
const useHandOff = (
  heading: 'up' | 'down',
  target: View | null,
): { arrive: () => void; leave: () => void } => {
  const isOnEdge = useRef(false);
  const arrivedAt = useRef(0);

  const hear = useCallback(
    (event: HWEvent) => {
      if (
        isOnEdge.current &&
        target !== null &&
        event.eventType === heading &&
        Date.now() - arrivedAt.current > SAME_PRESS_MS
      ) {
        isOnEdge.current = false;
        target.requestTVFocus();
      }
    },
    [heading, target],
  );

  useTVEventHandler(hear);

  const arrive = useCallback(() => {
    if (!isOnEdge.current) {
      arrivedAt.current = Date.now();
    }

    isOnEdge.current = true;
  }, []);

  const leave = useCallback(() => {
    isOnEdge.current = false;
  }, []);

  return { arrive, leave };
};

export { useHandOff };
