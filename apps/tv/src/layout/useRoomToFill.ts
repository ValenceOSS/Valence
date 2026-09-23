import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * How tall the space a list is put in turned out to be, for a list that cannot find out itself.
 *
 * On a television every list is wrapped in a focus guide that takes no style, sized to what is in
 * it, so a list told to fill its space has nothing to fill and is drawn one point tall. Measuring the
 * space and handing the list that height is what fills it.
 *
 * @returns The height measured, nothing until it has been, and what to hand the space's `onLayout`.
 */
const useRoomToFill = (): {
  height: number | null;
  onLayout: (event: LayoutChangeEvent) => void;
} => {
  const [height, setHeight] = useState<number | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setHeight(event.nativeEvent.layout.height);
  }, []);

  return { height, onLayout };
};

export { useRoomToFill };
