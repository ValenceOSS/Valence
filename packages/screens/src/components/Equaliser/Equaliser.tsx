import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { EqualiserProps } from './Equaliser.types';

const BARS = [
  { rests: 0.45, heights: [0.35, 1, 0.55, 0.85, 0.35], milliseconds: 900 },
  { rests: 0.8, heights: [0.8, 0.4, 1, 0.5, 0.8], milliseconds: 1100 },
  { rests: 0.6, heights: [0.55, 0.9, 0.3, 1, 0.55], milliseconds: 800 },
  { rests: 0.35, heights: [0.3, 0.7, 0.95, 0.45, 0.3], milliseconds: 1300 },
] as const;

/**
 * Four bars that rise and fall while something plays, to mark the song playing in a list of
 * songs at a glance.
 *
 * Each bar keeps its own rhythm, so the four never move together and read as sound rather than as
 * a loading indicator, and they move at an even pace rather than easing in and out of each beat.
 * The browser runs the loop itself rather than being told each frame, so a list redrawn several
 * times a second as the song plays never knocks the bars back to the start. Stopped — or for
 * somebody who has asked for less movement — they hold still at uneven heights, which still reads
 * as the same mark.
 *
 * @param label - What it marks, read out to anybody who cannot see it.
 * @param isMoving - Whether the bars move, or hold still.
 * @param className - Extra classes for the caller's own layout.
 */
const Equaliser = ({ label, isMoving = true, className }: EqualiserProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const moves = isMoving && prefersReducedMotion !== true;

  useEffect(() => {
    if (!moves) {
      return;
    }

    const running = BARS.flatMap((bar, at) => {
      const element = barsRef.current[at];

      if (element === null || element === undefined || typeof element.animate !== 'function') {
        return [];
      }

      return [
        element.animate(
          bar.heights.map((height) => ({ transform: `scaleY(${height.toString()})` })),
          { duration: bar.milliseconds, iterations: Number.POSITIVE_INFINITY, easing: 'linear' },
        ),
      ];
    });

    return () => {
      for (const animation of running) {
        animation.cancel();
      }
    };
  }, [moves]);

  return (
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex h-3.5 w-4 items-end justify-between', className)}
    >
      {BARS.map((bar, at) => (
        <span
          key={at.toString()}
          ref={(element) => {
            barsRef.current[at] = element;
          }}
          style={{ transform: `scaleY(${bar.rests.toString()})` }}
          className="block h-full w-[3px] origin-bottom rounded-full bg-current"
        />
      ))}
    </span>
  );
};

Equaliser.displayName = 'Equaliser';

export { Equaliser };
