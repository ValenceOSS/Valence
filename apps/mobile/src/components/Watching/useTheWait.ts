import { useCallback, useEffect, useState } from 'react';

/**
 * Whether the loading ring is shown while the film waits for more of itself, and whether it is
 * finishing: once the wait ends, the ring stays a moment longer to fill the rest of itself quickly,
 * as the web's does, rather than vanishing part way round.
 *
 * @param isWaiting - Whether the film is waiting now.
 * @returns Whether the ring is shown, whether it is finishing, and what to tell once it is whole.
 */
const useTheWait = (
  isWaiting: boolean,
): { isShown: boolean; isFinishing: boolean; onFilled: () => void } => {
  const [isShown, setIsShown] = useState(isWaiting);

  useEffect(() => {
    if (isWaiting) {
      setIsShown(true);
    }
  }, [isWaiting]);

  const onFilled = useCallback(() => {
    setIsShown(false);
  }, []);

  return { isShown, isFinishing: isShown && !isWaiting, onFilled };
};

export { useTheWait };
