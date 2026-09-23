import { useCallback, useRef } from 'react';
import { whereOnScreen } from '@ValenceTv/layout/whereOnScreen';
import type { View } from 'react-native';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';

/**
 * Keeps track of where a view is drawn, for something to fly to it or from it: it says where the
 * view is each time it is laid out, and can be asked where it is now.
 *
 * @param onAt - Told where the view is each time it is laid out, where anything wants to know.
 * @returns What to hand the view as its ref, what to call as it is laid out, and how to ask where
 *   it is.
 */
const useReportSpot = (
  onAt?: (at: Spot) => void,
): {
  ref: (view: View | null) => void;
  onLayout: () => void;
  whereNow: () => Promise<Spot | null>;
} => {
  const held = useRef<View | null>(null);

  const ref = useCallback((view: View | null) => {
    held.current = view;
  }, []);

  const onLayout = useCallback(() => {
    if (held.current !== null && onAt !== undefined) {
      void whereOnScreen(held.current).then(onAt);
    }
  }, [onAt]);

  const whereNow = useCallback(
    () => (held.current === null ? Promise.resolve(null) : whereOnScreen(held.current)),
    [],
  );

  return { ref, onLayout, whereNow };
};

export { useReportSpot };
