import { useCallback, useRef } from 'react';
import { whereOnScreen } from '@ValenceTv/layout/whereOnScreen';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';

/**
 * Keeps track of where a view is drawn, for something to fly to it or from it: it says where the
 * view is each time it is laid out, and can be asked where it is now.
 *
 * @param onAt - Told where the view is each time it is laid out, where anything wants to know.
 * @returns The ref to put on the view, what to call as it is laid out, and how to ask where it is.
 */
const useReportSpot = (
  onAt?: (at: Spot) => void,
): { ref: RefObject<View | null>; onLayout: () => void; whereNow: () => Promise<Spot | null> } => {
  const ref = useRef<View>(null);

  const onLayout = useCallback(() => {
    if (ref.current !== null && onAt !== undefined) {
      void whereOnScreen(ref.current).then(onAt);
    }
  }, [onAt]);

  const whereNow = useCallback(
    () => (ref.current === null ? Promise.resolve(null) : whereOnScreen(ref.current)),
    [],
  );

  return { ref, onLayout, whereNow };
};

export { useReportSpot };
