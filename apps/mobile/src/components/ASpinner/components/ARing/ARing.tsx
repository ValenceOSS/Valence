import { useEffect } from 'react';
import { AStatusMark } from '@ValenceMobile/components/AStatusMark/AStatusMark';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { ARingProps } from './ARing.types';
import { say } from '@ValenceI18n/say';

const TICK_DRAWS_MS = 460;

/**
 * Valence's loading mark in whatever colour it is given, as the web draws it: the status mark's
 * dashes marching round while something is awaited, and its tick drawn when told the wait is over,
 * saying so once the tick is drawn so whoever shows it can let it go.
 *
 * @param colour - The colour it waits in.
 * @param size - How wide it is drawn.
 * @param label - What is being waited for, read out in place of the mark.
 * @param isFinishing - Whether the wait is over, so it draws its tick.
 * @param onFilled - Told once the tick is drawn after finishing.
 */
const ARing = ({
  colour,
  size = 24,
  label = say('common.reading'),
  isFinishing = false,
  onFilled,
}: ARingProps) => {
  const isStill = usePrefersStillness();

  useEffect(() => {
    if (!isFinishing) {
      return undefined;
    }

    const drawn = setTimeout(
      () => {
        onFilled?.();
      },
      isStill ? 0 : TICK_DRAWS_MS,
    );

    return () => {
      clearTimeout(drawn);
    };
  }, [isFinishing, isStill, onFilled]);

  return (
    <AStatusMark
      state={isFinishing ? 'done' : 'loading'}
      colour={colour}
      size={size}
      label={label}
    />
  );
};

ARing.displayName = 'ARing';

export { ARing };
