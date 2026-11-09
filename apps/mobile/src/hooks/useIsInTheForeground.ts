import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Whether the app is the one in front, rather than behind the app switcher, a call or another app,
 * so something that moves by itself can stop while nobody can see it.
 *
 * @param state - What the phone says of the app.
 * @returns Whether it is in front.
 */
const isInFront = (state: string | null | undefined): boolean =>
  state !== 'background' && state !== 'inactive';

/**
 * Whether the app is in the foreground now, following it as it goes behind the app switcher or
 * another app and comes back.
 *
 * @returns Whether it is in the foreground.
 */
const useIsInTheForeground = (): boolean => {
  const [isInTheForeground, setIsInTheForeground] = useState(() =>
    isInFront(AppState.currentState),
  );

  useEffect(() => {
    const listening = AppState.addEventListener('change', (state) => {
      setIsInTheForeground(isInFront(state));
    });

    return () => {
      listening.remove();
    };
  }, []);

  return isInTheForeground;
};

export { useIsInTheForeground };
