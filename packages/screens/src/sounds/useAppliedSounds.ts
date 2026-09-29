import { useLayoutEffect } from 'react';
import { useSounds } from '@ValenceClient/shell/useSounds';
import { switchSounds } from '@ValenceUI/sounds/switchSounds';

/**
 * Plays the interface's sounds on this device when somebody has turned them on, and stops them when
 * they turn them off. Before anything is painted, so the first press after loading is heard or not
 * as it should be.
 */
const useAppliedSounds = (): void => {
  const { isOn } = useSounds();

  useLayoutEffect(() => {
    switchSounds(isOn);
  }, [isOn]);
};

export { useAppliedSounds };
