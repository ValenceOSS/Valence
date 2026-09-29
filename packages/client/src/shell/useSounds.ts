import { useCallback, useEffect, useState } from 'react';
import { chooseSounds, chosenSounds, whenSoundsChange } from '@ValenceClient/shell/sounds';

type SoundsChoice = {
  isOn: boolean;
  choose: (isOn: boolean) => void;
};

/**
 * Whether the interface's sounds are on for this device, and how to change it.
 *
 * @returns Whether they are on and the way to turn them on or off.
 */
const useSounds = (): SoundsChoice => {
  const [isOn, setIsOn] = useState(chosenSounds);

  useEffect(() => whenSoundsChange(setIsOn), []);

  const choose = useCallback((chosen: boolean) => {
    chooseSounds(chosen);
  }, []);

  return { isOn, choose };
};

export type { SoundsChoice };

export { useSounds };
