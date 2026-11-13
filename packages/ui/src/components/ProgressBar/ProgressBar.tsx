import * as RadixProgress from '@radix-ui/react-progress';
import { motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import type { ProgressBarProps } from './ProgressBar.types';

/**
 * Shows how far through a piece of long-running work something is. A null value means the work has
 * started but has not said how much there is to do, which is drawn as a short length sliding along
 * the track over and over, movement without a position, rather than as an empty bar — an empty bar
 * reads as nothing having happened. For anybody who has asked for less motion it rests in the middle.
 *
 * @param label - What the work is, read out to anybody who cannot see the bar.
 * @param value - How much is done, or null where the total is not yet known.
 * @param max - The total to measure against, defaulting to a hundred.
 * @param children - Anything to draw beneath the bar, such as what is being worked on now.
 * @param readout - The figure to show beside the bar, where a caller wants one of its own.
 * @param isFull - Whether the bar takes the whole width it is given, rather than its own short length.
 * @param isThin - Whether the bar is drawn thinner, for a small space such as the window bar, where
 *   the usual bar is heavier than the words beside it.
 * @param className - Extra classes for the caller's own layout.
 */
const ProgressBar = ({
  label,
  value,
  max = 100,
  children,
  readout,
  isFull = false,
  isThin = false,
  className,
}: ProgressBarProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <div className={cn('flex items-center gap-2', isFull ? 'w-full' : 'shrink-0', className)}>
      {children}

      <RadixProgress.Root
        value={value}
        max={max}
        aria-label={label}
        data-slot="progress"
        className={cn(
          'block overflow-hidden rounded-full bg-track',
          isThin ? 'h-1' : 'h-1.5',
          isFull ? 'w-full' : 'w-20 shrink-0',
        )}
      >
        {value === null ? (
          <motion.span
            className="block h-full w-2/5 rounded-full bg-primary"
            initial={{ x: '-100%' }}
            animate={isStill ? { x: '75%' } : { x: ['-100%', '250%'] }}
            transition={
              isStill ? { duration: 0 } : { duration: 1.4, ease: 'easeInOut', repeat: Infinity }
            }
          />
        ) : (
          <RadixProgress.Indicator
            style={{ width: `${((value / max) * 100).toString()}%` }}
            className="block h-full rounded-full bg-primary transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out)] motion-reduce:transition-none"
          />
        )}
      </RadixProgress.Root>

      {readout}
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
