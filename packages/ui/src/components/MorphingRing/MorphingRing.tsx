import { useEffect } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { StatusMark } from '@ValenceUI/StatusMark';
import type { MorphingRingProps } from './MorphingRing.types';

const TICK_DRAWS_MS = 460;

/**
 * Valence's loading mark: the status mark's dashes marching round while something of unknown
 * length is awaited, filling clockwise once there is a progress to show, and drawing its tick when
 * told the wait is over, saying so once the tick is drawn so whoever shows it can let it go.
 * Somebody who asked for less motion sees each state without the movement between them.
 *
 * @param size - How large to draw it, in pixels.
 * @param progress - How far along it is, from nothing to done, where that is known.
 * @param isFinishing - Whether what it waited for has arrived, so it draws its tick.
 * @param onFilled - Told once the tick is drawn after finishing.
 */
const MorphingRing = ({ size, progress, isFinishing = false, onFilled }: MorphingRingProps) => {
  const isStill = useReducedMotionConfig() === true;

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

  const state =
    isFinishing || (progress !== undefined && progress >= 1)
      ? 'done'
      : progress === undefined
        ? 'loading'
        : 'progress';

  return <StatusMark state={state} {...(progress === undefined ? {} : { progress })} size={size} />;
};

MorphingRing.displayName = 'MorphingRing';

export { MorphingRing };
