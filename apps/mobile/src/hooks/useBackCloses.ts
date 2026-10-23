import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Has Android's back button close something while it is open, before anything opened earlier has
 * a say: the button asks whoever said they would answer it most recently first.
 *
 * @param isOpen - Whether there is something to close.
 * @param close - How to close it, read as it stands when the button is pressed.
 */
const useBackCloses = (isOpen: boolean, close: () => void): void => {
  const latest = useRef(close);

  useEffect(() => {
    latest.current = close;
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const answering = BackHandler.addEventListener('hardwareBackPress', () => {
      latest.current();

      return true;
    });

    return () => {
      answering.remove();
    };
  }, [isOpen]);
};

export { useBackCloses };
