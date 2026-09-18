import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { EqualiserProps } from './Equaliser.types';

const BARS = [
  { rests: 0.45, heights: [0.35, 1, 0.55, 0.85, 0.35], seconds: 0.9 },
  { rests: 0.8, heights: [0.8, 0.4, 1, 0.5, 0.8], seconds: 1.1 },
  { rests: 0.6, heights: [0.55, 0.9, 0.3, 1, 0.55], seconds: 0.8 },
  { rests: 0.35, heights: [0.3, 0.7, 0.95, 0.45, 0.3], seconds: 1.3 },
] as const;

/**
 * Four bars that rise and fall while something plays, to mark the song playing in a list of
 * songs at a glance.
 *
 * Each bar keeps its own rhythm, so the four never move together and read as sound rather than as
 * a loading indicator. They are constant, so they move at an even pace rather than easing in and
 * out of each beat. Stopped — or for somebody who has asked for less movement — they hold still at
 * uneven heights, which still reads as the same mark.
 *
 * @param label - What it marks, read out to anybody who cannot see it.
 * @param isMoving - Whether the bars move, or hold still.
 * @param className - Extra classes for the caller's own layout.
 */
const Equaliser = ({ label, isMoving = true, className }: EqualiserProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const moves = isMoving && prefersReducedMotion !== true;

  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex h-3.5 w-4 items-end justify-between', className)}
    >
      {BARS.map((bar, at) => (
        <motion.span
          key={at.toString()}
          initial={false}
          animate={{ scaleY: moves ? [...bar.heights] : bar.rests }}
          transition={
            moves
              ? { duration: bar.seconds, ease: 'linear', repeat: Number.POSITIVE_INFINITY }
              : { duration: 0.2, ease: 'easeOut' }
          }
          className="block h-full w-[3px] origin-bottom rounded-full bg-current"
        />
      ))}
    </span>
  );
};

Equaliser.displayName = 'Equaliser';

export { Equaliser };
